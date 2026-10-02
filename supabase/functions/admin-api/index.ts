import { requireDashboardUser, corsHeaders, json } from "../_shared/auth.ts";
 
const orderStatuses = ["New","Confirmed","In Progress","Ready","Delivered","Completed","Cancelled"];
const requestStatuses = ["New","Contacted","Confirmed","Completed","Cancelled"];
const roles = ["admin","client"];
function clean(v:unknown,max:number){return String(v??"").trim().slice(0,max)}
function id(prefix:string){return `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`}
 
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:corsHeaders()});
  try{
    const body=await req.json();
    const action=String(body.action||"");
    const adminActions=["offers.","review.","content.","setting.","users."];
    const needsAdmin=adminActions.some(x=>action.startsWith(x));
    const {client,user,profile}=await requireDashboardUser(req,needsAdmin?["admin"]:["admin","client"]);
 
    switch(action){
      case "profile": return json({profile});
      case "product.create": {
        const p=body.product||{}; const prefix=p.Category==="Cake"?"CAKE":p.Category==="Cookie"?"COOK":"CUP";
        const row={ProductID:id(prefix),Category:clean(p.Category,20),Name:clean(p.Name,120),Description:clean(p.Description,2000),PricePer500g:p.Category==="Cake"?Number(p.PricePer500g):null,PricePerPiece:["Cookie","Cupcake"].includes(p.Category)?Number(p.PricePerPiece):null,ImageURL:clean(p.ImageURL,1000),InStock:p.Category==="Cake"?null:(p.InStock==="Y"?"Y":"N"),Bestseller:p.Bestseller==="Y"?"Y":"N"};
        if(!["Cake","Cookie","Cupcake"].includes(row.Category)||!row.Name) throw new Error("Invalid product data.");
        const {data,error}=await client.from("Products").insert(row).select().single(); if(error)throw error; return json({product:data});
      }
      case "product.update": {
        const p=body.changes||{}; const changes={Category:clean(p.Category,20),Name:clean(p.Name,120),Description:clean(p.Description,2000),PricePer500g:p.Category==="Cake"?Number(p.PricePer500g):null,PricePerPiece:["Cookie","Cupcake"].includes(p.Category)?Number(p.PricePerPiece):null,ImageURL:clean(p.ImageURL,1000),InStock:p.Category==="Cake"?null:(p.InStock==="Y"?"Y":"N"),Bestseller:p.Bestseller==="Y"?"Y":"N"};
        const {data,error}=await client.from("Products").update(changes).eq("ProductID",body.productId).select().single(); if(error)throw error; return json({product:data});
      }
      case "product.delete": { const {error}=await client.from("Products").delete().eq("ProductID",body.productId); if(error)throw error; return json({ok:true}); }
      case "stock.create": {
        const s=body.stock||{};
        const weight=Number(s.Weight), delta=Number(s.UnitsAvailable);
        if(![500,1000,1500,2000].includes(weight)) throw new Error("Weight must be 500, 1000, 1500 or 2000g.");
        if(!Number.isInteger(delta)||delta<=0) throw new Error("Enter a positive number of units to add.");
        const {data,error}=await client.rpc("add_product_stock",{p_product_id:clean(s.ProductID,80),p_weight:weight,p_delta:delta});
        if(error) throw error;
        return json({stock:data});
      }
      case "stock.update": { const s=body.changes||{}; const changes={Weight:Number(s.Weight),UnitsAvailable:Number(s.UnitsAvailable)}; if(!Number.isInteger(changes.Weight)||changes.Weight<=0||!Number.isInteger(changes.UnitsAvailable)||changes.UnitsAvailable<0)throw new Error("Invalid stock data."); const {data,error}=await client.from("ProductStock").update(changes).eq("StockID",body.stockId).select().single(); if(error)throw error; return json({stock:data}); }
      case "stock.delete": { const {error}=await client.from("ProductStock").delete().eq("StockID",body.stockId); if(error)throw error; return json({ok:true}); }
      case "orders.list": { const {data,error}=await client.from("Orders").select("*").order("DateNeeded",{ascending:true}).order("TimeNeeded",{ascending:true}); if(error)throw error; return json({orders:data||[]}); }
      case "order-items.list": { const {data,error}=await client.from("OrderItems").select("*, Products(Name,Category)").eq("OrderID",body.orderId); if(error)throw error; const items=(data||[]).map((x:any)=>({...x,ProductName:x.Products?.Name||x.ProductID})); return json({items}); }
      case "order.status": { if(!orderStatuses.includes(body.status))throw new Error("Invalid order status."); const {data,error}=await client.from("Orders").update({OrderStatus:body.status}).eq("OrderID",body.orderId).select().single(); if(error)throw error; return json({order:data}); }
      case "custom.list": { const {data,error}=await client.from("CustomCakeRequests").select("*").order("DateNeeded",{ascending:true}).order("TimeNeeded",{ascending:true}); if(error)throw error; return json({requests:data||[]}); }
      case "custom.status": { if(!requestStatuses.includes(body.status))throw new Error("Invalid request status."); const {data,error}=await client.from("CustomCakeRequests").update({Status:body.status}).eq("RequestID",body.requestId).select().single(); if(error)throw error; return json({request:data}); }
      case "reviews.list": { const {data,error}=await client.from("Reviews").select("*").order("ReviewID"); if(error)throw error; return json({reviews:data||[]}); }
      case "offers.list": { const {data,error}=await client.from("Offers").select("*").order("Code"); if(error)throw error; return json({offers:data||[]}); }
      case "offer.create": { const o=body.offer||{}; const row={OfferID:id("OFF"),Code:clean(o.Code,50).toUpperCase(),DiscountType:clean(o.DiscountType,20),DiscountValue:Number(o.DiscountValue),MinOrderValue:Number(o.MinOrderValue||0),ValidFrom:o.ValidFrom,ValidTo:o.ValidTo,UsageLimit:Number(o.UsageLimit||0),TimesUsed:0,Active:o.Active==="N"?"N":"Y"}; const {data,error}=await client.from("Offers").insert(row).select().single(); if(error)throw error; return json({offer:data}); }
      case "offer.update": { const o=body.changes||{}; const changes={Code:clean(o.Code,50).toUpperCase(),DiscountType:clean(o.DiscountType,20),DiscountValue:Number(o.DiscountValue),MinOrderValue:Number(o.MinOrderValue||0),ValidFrom:o.ValidFrom,ValidTo:o.ValidTo,UsageLimit:Number(o.UsageLimit||0),Active:o.Active==="N"?"N":"Y"}; const {data,error}=await client.from("Offers").update(changes).eq("OfferID",body.offerId).select().single(); if(error)throw error; return json({offer:data}); }
      case "offer.delete": { const {error}=await client.from("Offers").update({Active:"N"}).eq("OfferID",body.offerId); if(error)throw error; return json({ok:true}); }
      case "review.create": { const r=body.review||{}; const row={ReviewID:id("REV"),CustomerName:clean(r.CustomerName,120),Rating:Math.min(5,Math.max(1,Number(r.Rating||5))),Text:clean(r.Text,2000),PhotoURL:clean(r.PhotoURL,1000),DisplayOnSite:r.DisplayOnSite==="N"?"N":"Y"}; const {data,error}=await client.from("Reviews").insert(row).select().single(); if(error)throw error; return json({review:data}); }
      case "review.update": { const r=body.changes||{}; const changes={CustomerName:clean(r.CustomerName,120),Rating:Math.min(5,Math.max(1,Number(r.Rating||5))),Text:clean(r.Text,2000),PhotoURL:clean(r.PhotoURL,1000),DisplayOnSite:r.DisplayOnSite==="N"?"N":"Y"}; const {data,error}=await client.from("Reviews").update(changes).eq("ReviewID",body.reviewId).select().single(); if(error)throw error; return json({review:data}); }
      case "review.delete": { const {error}=await client.from("Reviews").delete().eq("ReviewID",body.reviewId); if(error)throw error; return json({ok:true}); }
      case "content.update": { const key=clean(body.key,200), value=clean(body.value,5000); const {data,error}=await client.from("SiteContent").update({Value:value}).eq("Key",key).select().single(); if(error)throw error; return json({content:data}); }
      case "setting.update": { const key=clean(body.key,100), value=clean(body.value,500); const {data,error}=await client.from("Settings").update({Value:value}).eq("Key",key).select().single(); if(error)throw error; return json({setting:data}); }
      case "users.list": { const {data,error}=await client.from("AdminUsers").select("UserID,Username,AuthUserID,AuthEmail,Role").order("Username"); if(error)throw error; return json({users:data||[]}); }
      case "users.create": { const u=body.user||{}; if(!roles.includes(u.Role))throw new Error("Role must be admin or client."); if(!clean(u.Username,60)||!clean(u.Email,160)||!u.Password)throw new Error("Username, email and password are required."); const {data:auth,error:authError}=await client.auth.admin.createUser({email:clean(u.Email,160),password:String(u.Password),email_confirm:true}); if(authError||!auth.user)throw authError||new Error("Unable to create Auth user."); const row={UserID:id("USR"),Username:clean(u.Username,60),AuthUserID:auth.user.id,AuthEmail:auth.user.email,Role:u.Role}; const {data,error}=await client.from("AdminUsers").insert(row).select("UserID,Username,AuthUserID,AuthEmail,Role").single(); if(error){await client.auth.admin.deleteUser(auth.user.id);throw error;} return json({user:data}); }
      case "users.update": { const changes:any={}; if(body.changes?.Username)changes.Username=clean(body.changes.Username,60); if(roles.includes(body.changes?.Role))changes.Role=body.changes.Role; const {data,error}=await client.from("AdminUsers").update(changes).eq("UserID",body.userId).select("UserID,Username,AuthUserID,AuthEmail,Role").single(); if(error)throw error; return json({user:data}); }
      case "users.delete": { const {data:target,error:targetError}=await client.from("AdminUsers").select("AuthUserID").eq("UserID",body.userId).single(); if(targetError||!target)throw targetError||new Error("User not found."); if(target.AuthUserID===user.id)throw new Error("You cannot delete the account you are currently using."); const {error}=await client.from("AdminUsers").delete().eq("UserID",body.userId); if(error)throw error; const {error:authError}=await client.auth.admin.deleteUser(target.AuthUserID); if(authError)throw authError; return json({ok:true}); }
      case "users.reset-password": { const password=String(body.password||""); if(password.length<8)throw new Error("Password must be at least 8 characters."); const {data:target,error:targetError}=await client.from("AdminUsers").select("AuthUserID").eq("UserID",body.userId).single(); if(targetError||!target)throw targetError||new Error("User not found."); const {error}=await client.auth.admin.updateUserById(target.AuthUserID,{password}); if(error)throw error; return json({ok:true}); }
      default: return json({error:"Unknown admin action."},400);
    }
  }catch(error){return json({error:error instanceof Error?error.message:"Admin operation failed."},400)}
});
 

