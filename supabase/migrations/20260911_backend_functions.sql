-- Oh My Cake backend functions.
-- Run this in Supabase SQL Editor after the ten application tables exist.

create or replace function public.validate_booking_window(
  p_date date,
  p_time time
) returns jsonb
language plpgsql
stable
as $$
declare
  v_now timestamp;
  v_requested timestamp;
  v_open time := '09:00';
  v_close time := '22:00';
  v_min_hours integer := 2;
  v_max_days integer := 10;
  v_earliest timestamp;
begin
  select coalesce(max(case when "Key"='ShopOpenTime' then "Value" end), '09:00')::time,
         coalesce(max(case when "Key"='ShopCloseTime' then "Value" end), '22:00')::time,
         coalesce(max(case when "Key"='MinLeadTimeHours' then "Value" end), '2')::integer,
         coalesce(max(case when "Key"='MaxLeadTimeDays' then "Value" end), '10')::integer
    into v_open, v_close, v_min_hours, v_max_days
  from public."Settings";

  v_now := now() at time zone 'Asia/Kolkata';
  v_requested := p_date + p_time;
  v_earliest := v_now + make_interval(hours => v_min_hours);

  if p_date is null or p_time is null then
    return jsonb_build_object('valid', false, 'message', 'Date and time are required.');
  end if;
  if p_date > (v_now::date + v_max_days) then
    return jsonb_build_object('valid', false, 'message', format('Bookings can be made at most %s days ahead.', v_max_days));
  end if;
  if p_date < v_now::date then
    return jsonb_build_object('valid', false, 'message', 'The selected date has already passed.');
  end if;
  if p_time < v_open or p_time > v_close then
    return jsonb_build_object('valid', false, 'message', 'Please choose a time within shop hours.', 'shopOpenTime', v_open, 'shopCloseTime', v_close);
  end if;
  if v_requested < v_earliest then
    return jsonb_build_object('valid', false, 'message', format('Please choose a slot at least %s hours from now.', v_min_hours), 'earliestSlot', v_earliest);
  end if;

  return jsonb_build_object('valid', true, 'earliestSlot', v_earliest, 'shopOpenTime', v_open, 'shopCloseTime', v_close);
end;
$$;

create or replace function public.create_catalog_order(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id text;
  v_item jsonb;
  v_product record;
  v_stock record;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_delivery numeric := 0;
  v_candle_price numeric := 5;
  v_candles integer := greatest(coalesce((p_payload->>'candleBoxCount')::integer, 0), 0);
  v_total numeric;
  v_offer record;
  v_booking jsonb;
  v_payment_mode text := coalesce(p_payload->>'paymentMode', 'Pay at Store');
  v_fulfillment text := coalesce(p_payload->>'fulfillment', 'Pickup');
  v_customer_name text := left(trim(coalesce(p_payload->>'name','')), 120);
  v_phone text := left(trim(coalesce(p_payload->>'phone','')), 30);
  v_email text := left(trim(coalesce(p_payload->>'email','')), 160);
  v_address text := left(trim(coalesce(p_payload->>'address','')), 500);
  v_occasion text := left(trim(coalesce(p_payload->>'occasion','')), 100);
  v_date date := (p_payload->>'date')::date;
  v_time time := (p_payload->>'time')::time;
  v_delivery_eligible boolean := coalesce((p_payload->>'deliveryEligible')::boolean, false);
  v_delivery_fee numeric := 0;
  v_line_price numeric;
  v_qty integer;
  v_weight integer;
  v_message text;
begin
  if v_customer_name = '' or v_phone = '' or v_email = '' or v_occasion = '' then
    raise exception 'Customer name, phone, email and occasion are required.';
  end if;
  if v_fulfillment not in ('Pickup','Delivery') then raise exception 'Invalid fulfillment type.'; end if;
  if v_payment_mode not in ('Online','Pay at Store') then raise exception 'Invalid payment mode.'; end if;
  if v_fulfillment = 'Delivery' and v_payment_mode <> 'Online' then raise exception 'Delivery orders require online payment.'; end if;
  if v_fulfillment = 'Delivery' and not v_delivery_eligible then raise exception 'Delivery is not available for this address.'; end if;
  if v_fulfillment = 'Pickup' and v_payment_mode = 'Online' then
    raise exception 'Online pickup payment is not connected until a payment gateway is configured.';
  end if;

  v_booking := public.validate_booking_window(v_date, v_time);
  if coalesce((v_booking->>'valid')::boolean, false) is not true then raise exception '%', v_booking->>'message'; end if;

  select coalesce(max("Value")::numeric,5) into v_candle_price from public."Settings" where "Key"='CandleBoxPrice';
  if v_fulfillment='Delivery' then
    select coalesce(max("Value")::numeric,60) into v_delivery_fee from public."Settings" where "Key"='DeliveryFeeFlat';
  end if;
  v_delivery := v_delivery_fee;

  if jsonb_typeof(p_payload->'items') <> 'array' or jsonb_array_length(p_payload->'items') = 0 then raise exception 'Your cart is empty.'; end if;

  for v_item in select * from jsonb_array_elements(p_payload->'items') loop
    v_qty := greatest(coalesce((v_item->>'Qty')::integer,0),0);
    if v_qty < 1 then raise exception 'Invalid quantity.'; end if;
    v_weight := nullif(v_item->>'Weight','')::integer;
    v_message := left(trim(coalesce(v_item->>'CakeMessage','')),120);

    select * into v_product from public."Products" where "ProductID" = v_item->>'ProductID' for share;
    if not found then raise exception 'A product in your cart is no longer available.'; end if;

    if v_product."Category"='Cake' then
      if v_weight is null or v_weight <= 0 or mod(v_weight,500) <> 0 then raise exception 'Invalid cake weight.'; end if;
      v_line_price := coalesce(v_product."PricePer500g",0) * (v_weight::numeric/500) * v_qty;
      select * into v_stock from public."ProductStock" where "ProductID"=v_product."ProductID" and "Weight"=v_weight and "UnitsAvailable" >= v_qty for update;
      if not found then raise exception 'Not enough stock for % at % grams.', v_product."Name", v_weight; end if;
      update public."ProductStock" set "UnitsAvailable"="UnitsAvailable"-v_qty where "StockID"=v_stock."StockID";
    elsif v_product."Category" in ('Cookie','Cupcake') then
      if coalesce(v_product."InStock",'N') <> 'Y' then raise exception '% is currently out of stock.', v_product."Name"; end if;
      if v_weight is not null then raise exception 'Cookies and cupcakes do not use weight variants.'; end if;
      v_line_price := coalesce(v_product."PricePerPiece",0) * v_qty;
      v_message := '';
    else
      raise exception 'Invalid product category.';
    end if;

    v_subtotal := v_subtotal + v_line_price;
  end loop;

  if p_payload->>'offerCode' is not null and trim(p_payload->>'offerCode') <> '' then
    select * into v_offer from public."Offers" where upper("Code")=upper(trim(p_payload->>'offerCode')) and "Active"='Y' for update;
    if not found then raise exception 'Invalid or expired offer code.'; end if;
    if current_date < v_offer."ValidFrom" or current_date > v_offer."ValidTo" then raise exception 'This offer is outside its valid dates.'; end if;
    if v_subtotal < coalesce(v_offer."MinOrderValue",0) then raise exception 'Minimum order value is ₹%.', v_offer."MinOrderValue"; end if;
    if coalesce(v_offer."UsageLimit",0)>0 and coalesce(v_offer."TimesUsed",0)>=v_offer."UsageLimit" then raise exception 'This offer has reached its usage limit.'; end if;
    if lower(v_offer."DiscountType")='percent' then v_discount := round(v_subtotal * v_offer."DiscountValue" / 100); else v_discount := v_offer."DiscountValue"; end if;
    v_discount := least(v_discount, v_subtotal);
    update public."Offers" set "TimesUsed"=coalesce("TimesUsed",0)+1 where "OfferID"=v_offer."OfferID";
  end if;

  v_total := greatest(0, v_subtotal + v_delivery + v_candles*v_candle_price - v_discount);
  v_order_id := 'ORD-' || to_char((now() at time zone 'Asia/Kolkata'),'YYYYMMDD') || '-' || lpad((floor(random()*1000000))::bigint::text,6,'0');

  insert into public."Orders" (
    "OrderID","CustomerName","Phone","Email","FulfillmentType","Address","MapLink","DeliveryFee","CandleBoxCount","PaymentMode","PaymentStatus","OrderStatus","Occasion","DateNeeded","TimeNeeded","TotalAmount"
  ) values (
    v_order_id,v_customer_name,v_phone,v_email,v_fulfillment,case when v_fulfillment='Delivery' then v_address else '' end,coalesce(p_payload->>'mapLink',''),v_delivery,v_candles,v_payment_mode,case when v_payment_mode='Pay at Store' then 'Awaiting Payment at Pickup' else 'Paid' end,'New',v_occasion,v_date,v_time,v_total
  );

  for v_item in select * from jsonb_array_elements(p_payload->'items') loop
    v_qty := (v_item->>'Qty')::integer;
    v_weight := nullif(v_item->>'Weight','')::integer;
    select * into v_product from public."Products" where "ProductID"=v_item->>'ProductID';
    if v_product."Category"='Cake' then v_line_price := v_product."PricePer500g"*(v_weight::numeric/500)*v_qty; else v_line_price := v_product."PricePerPiece"*v_qty; end if;
    insert into public."OrderItems" ("OrderItemID","OrderID","ProductID","Weight","Qty","CakeMessage","ItemPrice")
    values ('OI-'||upper(substr(md5(random()::text||clock_timestamp()::text),1,10)),v_order_id,v_product."ProductID",v_weight,v_qty,left(trim(coalesce(v_item->>'CakeMessage','')),120),v_line_price);
  end loop;

  return jsonb_build_object('ok',true,'orderId',v_order_id,'total',v_total);
exception when others then
  raise;
end;
$$;

revoke all on function public.create_catalog_order(jsonb) from public;
revoke all on function public.validate_booking_window(date,time) from public;
grant execute on function public.create_catalog_order(jsonb) to service_role;
grant execute on function public.validate_booking_window(date,time) to service_role;
