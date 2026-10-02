import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Boxes, ClipboardList, FileText, Gift, LogOut, MessageSquare, Settings, ShieldCheck, Users, WalletCards, Image, Search, ChevronRight, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  createProduct, updateProduct, deleteProduct, fetchProductStock, createProductStock, updateProductStock, deleteProductStock,
  fetchOrders, fetchOrderItems, updateOrderStatus, fetchCustomRequests, updateCustomRequestStatus,
  fetchOffers, createOffer, updateOffer, deleteOffer, createReview, updateReview, deleteReview,
  updateSiteContent, updateSetting, uploadImage, fetchAllReviews, fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, resetAdminPassword
} from "../services/api";

const clientItems=[["overview","Overview",BarChart3],["products","Products & Stock",Boxes],["orders","Orders",ClipboardList],["custom","Custom Cake Requests",FileText]];
const adminItems=[["offers","Offers / Coupons",Gift],["reviews","Reviews",MessageSquare],["content","Site Content",Image],["settings","Settings",Settings],["payments","Payment & Notifications",WalletCards],["users","Admin Accounts",Users]];
const orderStatuses=["New","Confirmed","In Progress","Ready","Delivered","Completed","Cancelled"];
const WEIGHT_TIERS=[500,1000,1500,2000];
const requestStatuses=["New","Contacted","Confirmed","Completed","Cancelled"];

export default function AdminDashboard(){
  const {session,logout,products,setProducts,reviews,setReviews,siteContent,setSiteContent,settings,setSettings}=useApp();
  const navigate=useNavigate(); const isAdmin=session?.role==="admin"; const [section,setSection]=useState("overview"); const [orders,setOrders]=useState([]); const [requests,setRequests]=useState([]); const [loading,setLoading]=useState(true);
  const menu=[...clientItems,...(isAdmin?adminItems:[])];
  const reload=async()=>{setLoading(true);try{const [o,r]=await Promise.all([fetchOrders(),fetchCustomRequests()]);setOrders(o);setRequests(r);}catch(e){alert(e.message||"Unable to load dashboard data.")}finally{setLoading(false)}};
  useEffect(()=>{reload()},[]);
  const logoutNow=async()=>{await logout();navigate("/admin/login")};
  return <div className="dashboard"><aside className="dashboard-sidebar"><Link to="/" className="brand dashboard-brand"><span className="brand-mark"><ShieldCheck size={20}/></span><span><strong>Oh My Cake</strong><small>{isAdmin?"Admin":"Client"} dashboard</small></span></Link><nav>{menu.map(([id,label,Icon])=><button key={id} className={section===id?"active":""} onClick={()=>setSection(id)}><Icon size={18}/><span>{label}</span></button>)}</nav><div className="sidebar-bottom"><div className="role-chip"><span>{session?.username||session?.name}</span><small>{session?.role}</small></div><button onClick={logoutNow}><LogOut size={17}/> Log out</button></div></aside>
    <main className="dashboard-main"><header className="dashboard-top"><div><span className="eyebrow">Dashboard</span><h1>{menu.find(x=>x[0]===section)?.[1]||"Overview"}</h1></div><div className="dashboard-actions"><span className="status-pill"><span/> Live Supabase</span><button className="btn btn-ghost" onClick={reload}>Refresh</button><Link to="/" className="btn btn-ghost">View shop</Link></div></header>
      {loading&&section==="overview"?<div className="notice-box"><strong>Loading dashboard</strong><span>Fetching live Supabase data…</span></div>:null}
      {section==="overview"&&<Overview orders={orders} requests={requests} products={products}/>} 
      {section==="products"&&<Products products={products} setProducts={setProducts}/>} 
      {section==="orders"&&<Orders orders={orders} setOrders={setOrders}/>} 
      {section==="custom"&&<CustomRequests requests={requests} setRequests={setRequests}/>} 
      {section==="offers"&&isAdmin&&<OffersAdmin/>}
      {section==="reviews"&&isAdmin&&<ReviewsAdmin reviews={reviews} setReviews={setReviews}/>} 
      {section==="content"&&isAdmin&&<ContentAdmin siteContent={siteContent} setSiteContent={setSiteContent}/>} 
      {section==="settings"&&isAdmin&&<SettingsAdmin settings={settings} setSettings={setSettings}/>} 
      {section==="payments"&&isAdmin&&<PaymentAdmin/>}
      {section==="users"&&isAdmin&&<UsersAdmin currentUserId={session.authUserId}/>} 
    </main></div>;
}

function Overview({orders,requests,products}){const revenue=orders.reduce((s,o)=>s+Number(o.TotalAmount||0),0);return <div><div className="stats-grid"><Stat label="Catalog orders" value={orders.length}/><Stat label="Recorded revenue" value={`₹${revenue.toLocaleString("en-IN")}`}/><Stat label="Custom requests" value={requests.length}/><Stat label="Products" value={products.length}/></div><div className="dashboard-grid"><Panel title="Recent orders"><OrdersTable orders={orders.slice(0,8)}/></Panel><Panel title="Custom cake requests"><div className="mini-list">{requests.slice(0,8).map(r=><div key={r.RequestID}><span><strong>{r.CustomerName}</strong><small>{r.Occasion} · {r.DateNeeded}</small></span><b>{r.Status}</b></div>)}{!requests.length&&<Empty text="No custom requests yet."/>}</div></Panel></div></div>}
function Stat({label,value}){return <div className="stat-card"><span>{label}</span><strong>{value}</strong><small>Live Supabase data</small></div>}
function Panel({title,children}){return <section className="dash-panel"><div className="dash-panel-head"><h3>{title}</h3><ChevronRight size={17}/></div>{children}</section>}
function Empty({text}){return <div className="empty-state"><p>{text}</p></div>}

function Products({products,setProducts}){
  const [category,setCategory]=useState("All"),[draft,setDraft]=useState(null),[saving,setSaving]=useState(false),[selectedCakeId,setSelectedCakeId]=useState(""),[stockRows,setStockRows]=useState([]),[stockDraft,setStockDraft]=useState(null),[stockSaving,setStockSaving]=useState(false);
  const categories=["All",...Array.from(new Set(products.map(p=>p.Category).filter(Boolean)))];
  const list=products.filter(p=>category==="All"||p.Category===category);
  const cakes=products.filter(p=>p.Category==="Cake");

  const save=async()=>{
    if(!draft?.Name?.trim()||!draft?.Category) return alert("Name and category are required.");
    if(draft.__new&&!draft.imageFile) return alert("Please upload a product image.");
    try{
      setSaving(true);
      let imageUrl=draft.ImageURL||"";
      if(draft.imageFile) imageUrl=await uploadImage(draft.imageFile);
      const payload={...draft,ImageURL:imageUrl};
      delete payload.__new; delete payload.imageFile;
      let result;
      if(draft.__new){
        result=await createProduct(payload);
        setProducts(p=>[...p,result.product]);
      }else{
        result=await updateProduct(draft.ProductID,payload);
        setProducts(p=>p.map(x=>x.ProductID===draft.ProductID?result.product:x));
      }
      setDraft(null);
    }catch(e){alert(e.message)}finally{setSaving(false)}
  };

  const remove=async p=>{
    if(!confirm(`Delete ${p.Name}?`))return;
    try{await deleteProduct(p.ProductID);setProducts(xs=>xs.filter(x=>x.ProductID!==p.ProductID))}catch(e){alert(e.message)}
  };

  useEffect(()=>{
    if(!selectedCakeId){setStockRows([]);return;}
    fetchProductStock(selectedCakeId).then(rows=>setStockRows(Array.isArray(rows)?rows:[])).catch(e=>{setStockRows([]);alert(e.message)})
  },[selectedCakeId]);

  const openNewStock=()=>setStockDraft({__new:true,Weight:"",UnitsAvailable:""});

  const saveStock=async()=>{
    if(!stockDraft)return;
    if(stockDraft.__new&&!selectedCakeId)return alert("Please select a cake first.");
    const weight=Number(stockDraft.Weight),units=Number(stockDraft.UnitsAvailable);
    if(!WEIGHT_TIERS.includes(weight))return alert("Weight must be 500, 1000, 1500 or 2000g.");
    if(!Number.isInteger(units)||units<0)return alert("Units must be 0 or a positive whole number.");
    try{
      setStockSaving(true);
      let result;
      if(stockDraft.__new){
        result=await createProductStock({ProductID:selectedCakeId,Weight:weight,UnitsAvailable:units});
        setStockRows(rows=>{
          const exists=rows.some(r=>r.StockID===result.stock.StockID);
          return (exists?rows.map(r=>r.StockID===result.stock.StockID?result.stock:r):[...rows,result.stock]).sort((a,b)=>Number(a.Weight)-Number(b.Weight));
        });
      }else{
        result=await updateProductStock(stockDraft.StockID,{Weight:stockDraft.Weight,UnitsAvailable:units});
        setStockRows(rows=>rows.map(row=>row.StockID===stockDraft.StockID?result.stock:row).sort((a,b)=>Number(a.Weight)-Number(b.Weight)));
      }
      setStockDraft(null);
    }catch(e){alert(e.message)}finally{setStockSaving(false)}
  };

  const removeStock=async row=>{
    if(!confirm(`Delete the ${row.Weight}g stock entry?`))return;
    try{await deleteProductStock(row.StockID);setStockRows(rows=>rows.filter(x=>x.StockID!==row.StockID))}catch(e){alert(e.message)}
  };

  return <div>
    <div className="page-title-row">
      <div><span className="eyebrow">Client + Admin</span><h2>Products</h2></div>
      <button className="btn btn-primary" onClick={()=>setDraft({__new:true,Category:"Cake",Name:"",Description:"",PricePer500g:"",PricePerPiece:"",ImageURL:"",InStock:"Y",Bestseller:"N"})}><Plus size={16}/> Add product</button>
    </div>

    <div className="sort-control"><label>Category <select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select></label></div>

    <div className="admin-table products-table">
      <div className="table-head"><span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Best seller</span><span/></div>
      {list.map(p=><div className="table-row" key={p.ProductID}>
        <span><strong>{p.Name}</strong><small>{p.ProductID}</small></span>
        <span>{p.Category}</span>
        <span>{p.Category==="Cake"?`₹${p.PricePer500g}/500g`:`₹${p.PricePerPiece}/piece`}</span>
        <span>{p.Category==="Cake"?"Managed below":(p.InStock==="Y"?"Available":"Out of stock")}</span>
        <span>{p.Bestseller==="Y"?"★ Yes":"No"}</span>
        <span className="row-actions"><button className="icon-btn" onClick={()=>setDraft({...p})}><Pencil size={15}/></button><button className="icon-btn danger" onClick={()=>remove(p)}><Trash2 size={15}/></button></span>
      </div>)}
      {!list.length&&<Empty text="No products found."/>}
    </div>

    <Panel title="Cake stock by baked size">
      <div className="form-grid">
        <label>Select cake<select value={selectedCakeId} onChange={e=>setSelectedCakeId(e.target.value)}><option value="">Choose a cake</option>{cakes.map(p=><option key={p.ProductID} value={p.ProductID}>{p.Name}</option>)}</select></label>
      </div>

      {selectedCakeId&&<>
        <button className="btn btn-primary" onClick={openNewStock}><Plus size={15}/> Add stock</button>
        <div className="admin-table stock-table">
          <div className="table-head"><span>Weight</span><span>Units Available</span><span>Status</span><span>Actions</span></div>
          {stockRows.map(r=><div className="table-row" key={r.StockID}>
            <span><strong>{Number(r.Weight)>=1000?`${Number(r.Weight)/1000} kg`:`${r.Weight} g`}</strong></span>
            <span><strong>{Number(r.UnitsAvailable||0)}</strong></span>
            <span>{Number(r.UnitsAvailable||0)>0?"Available":"Out of stock"}</span>
            <span className="row-actions"><button className="icon-btn" onClick={()=>setStockDraft({...r})} title="Edit stock"><Pencil size={15}/></button><button className="icon-btn danger" onClick={()=>removeStock(r)} title="Delete stock"><Trash2 size={15}/></button></span>
          </div>)}
          {!stockRows.length&&<Empty text="No baked stock recorded for this cake."/>}
        </div>
      </>}
    </Panel>

    {draft&&<Modal title={draft.__new?"Add product":"Edit product"} onClose={()=>setDraft(null)}>
      <div className="form-grid">
        <label>Category<select value={draft.Category} onChange={e=>setDraft({...draft,Category:e.target.value})}><option>Cake</option><option>Cookie</option><option>Cupcake</option></select></label>
        <label>Name<input value={draft.Name} onChange={e=>setDraft({...draft,Name:e.target.value})}/></label>
        <label>Description<textarea value={draft.Description||""} onChange={e=>setDraft({...draft,Description:e.target.value})}/></label>
        {draft.Category==="Cake"?<label>Price / 500g<input type="number" min="0" value={draft.PricePer500g??""} onChange={e=>setDraft({...draft,PricePer500g:e.target.value})}/></label>:<><label>Price / piece<input type="number" min="0" value={draft.PricePerPiece??""} onChange={e=>setDraft({...draft,PricePerPiece:e.target.value})}/></label><label>In stock<select value={draft.InStock||"Y"} onChange={e=>setDraft({...draft,InStock:e.target.value})}><option>Y</option><option>N</option></select></label></>}
        <label>Product image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0]||null;if(file&&file.size>5*1024*1024){alert("Image must be 5 MB or smaller.");return}setDraft({...draft,imageFile:file})}}/><small className="field-note">Upload directly to the shared Google Drive folder. No URL pasting.</small>{draft.ImageURL&&<small className="field-note">Current image is already saved.</small>}</label>
        <label>Bestseller<select value={draft.Bestseller||"N"} onChange={e=>setDraft({...draft,Bestseller:e.target.value})}><option>Y</option><option>N</option></select></label>
      </div>
      <div className="form-actions"><button className="btn btn-ghost" onClick={()=>setDraft(null)}>Cancel</button><button className="btn btn-primary" disabled={saving} onClick={save}><Save size={15}/>{saving?"Saving…":"Save"}</button></div>
    </Modal>}

    {stockDraft&&<Modal title={stockDraft.__new?"Add stock entry":"Edit stock entry"} onClose={()=>setStockDraft(null)}>
      <div className="form-grid">
        <label>Weight
          <select value={stockDraft.Weight} disabled={!stockDraft.__new} onChange={e=>setStockDraft({...stockDraft,Weight:e.target.value})}>
            <option value="">Select weight</option>
            {WEIGHT_TIERS.map(w=><option key={w} value={w}>{w>=1000?`${w/1000} kg`:`${w} g`}</option>)}
          </select>
          <small className="field-note">{stockDraft.__new?"Choose the baked size.":"Weight can't be changed on an existing entry — delete and re-add if needed."}</small>
        </label>
        <label>{stockDraft.__new?"Units to add":"Units available"}<input type="number" min={stockDraft.__new?"1":"0"} step="1" placeholder={stockDraft.__new?"e.g. 5":"0"} value={stockDraft.UnitsAvailable} onChange={e=>setStockDraft({...stockDraft,UnitsAvailable:e.target.value})}/><small className="field-note">{stockDraft.__new?"This adds to whatever is already in stock for this size.":"Set to 0 when this size is sold out."}</small></label>
      </div>
      <div className="form-actions"><button className="btn btn-ghost" onClick={()=>setStockDraft(null)}>Cancel</button><button className="btn btn-primary" disabled={stockSaving} onClick={saveStock}><Save size={15}/>{stockSaving?"Saving…":"Save stock"}</button></div>
    </Modal>}
  </div>;
}

function Orders({orders,setOrders}){const [selected,setSelected]=useState(null),[items,setItems]=useState([]),[search,setSearch]=useState(""),[loading,setLoading]=useState(false);const filtered=orders.filter(o=>`${o.OrderID} ${o.CustomerName} ${o.Phone}`.toLowerCase().includes(search.toLowerCase()));const open=async o=>{setSelected(o);setLoading(true);try{const data=await fetchOrderItems(o.OrderID);setItems(data)}catch(e){alert(e.message)}finally{setLoading(false)}};const status=async e=>{try{const updated=await updateOrderStatus(selected.OrderID,e.target.value);setSelected(updated);setOrders(xs=>xs.map(x=>x.OrderID===updated.OrderID?updated:x))}catch(err){alert(err.message)}};return <div><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search orders..."/></div><div className="admin-table orders-table"><div className="table-head"><span>Order</span><span>Customer</span><span>Fulfillment</span><span>Total</span><span>Status</span><span/></div>{filtered.map(o=><button className="table-row" key={o.OrderID} onClick={()=>open(o)}><span><strong>{o.OrderID}</strong><small>{o.DateNeeded} · {o.TimeNeeded}</small></span><span><strong>{o.CustomerName}</strong><small>{o.Phone}</small></span><span>{o.FulfillmentType}</span><span>₹{Number(o.TotalAmount||0).toLocaleString("en-IN")}</span><span>{o.OrderStatus}</span><span><ChevronRight size={16}/></span></button>)}{!filtered.length&&<Empty text="No orders found."/>}</div>{selected&&<Modal title={`Order ${selected.OrderID}`} onClose={()=>setSelected(null)}><div className="two-col-admin"><div><strong>Customer</strong><p>{selected.CustomerName}<br/>{selected.Phone}<br/>{selected.Email}</p></div><div><strong>Fulfillment</strong><p>{selected.FulfillmentType}<br/>{selected.Address||"Pickup"}</p></div><div><strong>Payment</strong><p>{selected.PaymentMode}<br/>{selected.PaymentStatus}</p></div><div><strong>Total</strong><p>₹{Number(selected.TotalAmount||0).toLocaleString("en-IN")} · {selected.CandleBoxCount||0} candle box(es)</p></div></div><label>Order status<select value={selected.OrderStatus} onChange={status}>{orderStatuses.map(x=><option key={x}>{x}</option>)}</select></label><h3>Order items</h3>{loading?<p>Loading…</p>:items.map(i=><div className="mini-list" key={i.OrderItemID}><div><span><strong>{i.ProductName||i.ProductID}</strong><small>{i.Weight?`${i.Weight}g · `:""}{i.CakeMessage||""}</small></span><b>{i.Qty} × ₹{Number(i.ItemPrice||0).toLocaleString("en-IN")}</b></div></div>)}</Modal>}</div>}

function CustomRequests({requests,setRequests}){const [selected,setSelected]=useState(null);const change=async status=>{try{const updated=await updateCustomRequestStatus(selected.RequestID,status);setSelected(updated);setRequests(xs=>xs.map(x=>x.RequestID===updated.RequestID?updated:x))}catch(e){alert(e.message)}};return <div className="admin-table requests-table"><div className="table-head"><span>Request</span><span>Customer</span><span>Occasion</span><span>Date</span><span>Status</span><span/></div>{requests.map(r=><button className="table-row" key={r.RequestID} onClick={()=>setSelected(r)}><span><strong>{r.RequestID}</strong><small>{r.Flavor} · {r.Weight||"—"}</small></span><span>{r.CustomerName}</span><span>{r.Occasion}</span><span>{r.DateNeeded} · {r.TimeNeeded}</span><span>{r.Status}</span><span><ChevronRight size={16}/></span></button>)}{!requests.length&&<Empty text="No custom cake requests yet."/>}{selected&&<Modal title={`Custom request ${selected.RequestID}`} onClose={()=>setSelected(null)}><div className="two-col-admin"><div><strong>Customer</strong><p>{selected.CustomerName}<br/>{selected.Phone}<br/>{selected.Email}</p></div><div><strong>Cake</strong><p>{selected.Occasion}<br/>{selected.Flavor}<br/>Qty: {selected.Qty}<br/>Weight: {selected.Weight||"—"}</p></div><div><strong>Fulfillment</strong><p>{selected.FulfillmentType}<br/>{selected.Address||"Pickup"}</p></div><div><strong>Requested</strong><p>{selected.DateNeeded} · {selected.TimeNeeded}</p></div></div><p>{selected.Description}</p>{selected.ReferenceImageURL&&<a className="btn btn-ghost" href={selected.ReferenceImageURL} target="_blank" rel="noreferrer">View reference image</a>}<label>Status<select value={selected.Status} onChange={e=>change(e.target.value)}>{requestStatuses.map(x=><option key={x}>{x}</option>)}</select></label></Modal>}</div>}

function OffersAdmin(){
  const [rows,setRows]=useState([]),[draft,setDraft]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
  const load=async()=>{try{setLoading(true);const data=await fetchOffers();setRows(Array.isArray(data)?data:[])}catch(e){console.error(e);alert(e.message||"Unable to load offers.")}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);

  const save=async()=>{
    if(!draft)return;
    const code=String(draft.Code||"").trim().toUpperCase();
    const type=String(draft.DiscountType||"Flat");
    const value=Number(draft.DiscountValue);
    const min=Number(draft.MinOrderValue||0);
    const limit=Number(draft.UsageLimit||0);
    if(!code)return alert("Offer code is required.");
    if(!draft.ValidFrom||!draft.ValidTo)return alert("Valid from and valid to dates are required.");
    if(draft.ValidFrom>draft.ValidTo)return alert("Valid to date cannot be before valid from date.");
    if(!Number.isFinite(value)||value<0)return alert("Enter a valid discount value.");
    if(type==="Percent"&&value>100)return alert("Percentage discount cannot be greater than 100.");
    if(!Number.isFinite(min)||min<0)return alert("Enter a valid minimum order value.");
    if(!Number.isInteger(limit)||limit<0)return alert("Usage limit must be 0 or a positive whole number.");
    try{
      setSaving(true);
      const payload={Code:code,DiscountType:type,DiscountValue:value,MinOrderValue:min,ValidFrom:draft.ValidFrom,ValidTo:draft.ValidTo,UsageLimit:limit,Active:draft.Active==="N"?"N":"Y"};
      const saved=draft.__new?await createOffer(payload):await updateOffer(draft.OfferID,payload);
      setRows(xs=>draft.__new?[...xs,saved]:xs.map(x=>x.OfferID===saved.OfferID?saved:x));
      setDraft(null);
    }catch(e){console.error(e);alert(e.message||"Unable to save offer.")}finally{setSaving(false)}
  };

  const remove=async offer=>{
    if(!confirm(`Deactivate offer "${offer.Code}"?`))return;
    try{await deleteOffer(offer.OfferID);setRows(xs=>xs.map(x=>x.OfferID===offer.OfferID?{...x,Active:"N"}:x))}catch(e){alert(e.message||"Unable to deactivate offer.")}
  };

  return <div>
    <div className="page-title-row"><div><span className="eyebrow">Admin</span><h2>Offers / Coupons</h2></div><button className="btn btn-primary" onClick={()=>setDraft({__new:true,Code:"",DiscountType:"Flat",DiscountValue:0,MinOrderValue:0,ValidFrom:"",ValidTo:"",UsageLimit:0,Active:"Y"})}><Plus size={15}/> Add offer</button></div>
    {loading?<div className="notice-box"><strong>Loading offers</strong><span>Fetching offers from Supabase…</span></div>:<div className="admin-table offers-table">
      <div className="table-head"><span>Code</span><span>Discount</span><span>Minimum order</span><span>Valid dates</span><span>Usage</span><span>Status</span><span/></div>
      {rows.map(o=><div className="table-row" key={o.OfferID}>
        <span><strong>{o.Code}</strong><small>{o.DiscountType}</small></span>
        <span>{String(o.DiscountType).toLowerCase()==="percent"?`${o.DiscountValue}%`:`₹${o.DiscountValue}`}</span>
        <span>₹{Number(o.MinOrderValue||0)}</span>
        <span>{o.ValidFrom} → {o.ValidTo}</span>
        <span>{o.TimesUsed||0}/{Number(o.UsageLimit||0)>0?o.UsageLimit:"∞"}</span>
        <span>{o.Active==="Y"?"Active":"Inactive"}</span>
        <span className="row-actions"><button className="icon-btn" onClick={()=>setDraft({...o})} title="Edit offer"><Pencil size={15}/></button>{o.Active==="Y"&&<button className="icon-btn danger" onClick={()=>remove(o)} title="Deactivate offer"><Trash2 size={15}/></button>}</span>
      </div>)}
      {!rows.length&&<Empty text="No offers have been created yet."/>}
    </div>}

    {draft&&<Modal title={draft.__new?"Add offer":"Edit offer"} onClose={()=>setDraft(null)}>
      <div className="form-grid">
        <label>Code<input value={draft.Code||""} placeholder="WELCOME10" onChange={e=>setDraft({...draft,Code:e.target.value.toUpperCase()})}/></label>
        <label>Type<select value={draft.DiscountType||"Flat"} onChange={e=>setDraft({...draft,DiscountType:e.target.value})}><option>Flat</option><option>Percent</option></select></label>
        <label>Value<input type="number" min="0" step="1" value={draft.DiscountValue??0} onChange={e=>setDraft({...draft,DiscountValue:e.target.value})}/></label>
        <label>Minimum order<input type="number" min="0" step="1" value={draft.MinOrderValue??0} onChange={e=>setDraft({...draft,MinOrderValue:e.target.value})}/></label>
        <label>Valid from<input type="date" value={draft.ValidFrom||""} onChange={e=>setDraft({...draft,ValidFrom:e.target.value})}/></label>
        <label>Valid to<input type="date" value={draft.ValidTo||""} onChange={e=>setDraft({...draft,ValidTo:e.target.value})}/></label>
        <label>Usage limit<input type="number" min="0" step="1" value={draft.UsageLimit??0} onChange={e=>setDraft({...draft,UsageLimit:e.target.value})}/><small className="field-note">Use 0 for unlimited usage.</small></label>
        <label>Active<select value={draft.Active||"Y"} onChange={e=>setDraft({...draft,Active:e.target.value})}><option>Y</option><option>N</option></select></label>
      </div>
      <div className="form-actions"><button className="btn btn-ghost" onClick={()=>setDraft(null)}>Cancel</button><button className="btn btn-primary" disabled={saving} onClick={save}><Save size={15}/>{saving?"Saving…":"Save offer"}</button></div>
    </Modal>}
  </div>;
}

function ReviewsAdmin({reviews,setReviews}){const [rows,setRows]=useState(reviews),[draft,setDraft]=useState(null);useEffect(()=>{fetchAllReviews().then(data=>{setRows(data);setReviews(data)}).catch(e=>alert(e.message))},[]);const save=async()=>{try{const data=draft.__new?await createReview(draft):await updateReview(draft.ReviewID,draft);setRows(xs=>draft.__new?[...xs,data.review]:xs.map(x=>x.ReviewID===data.review.ReviewID?data.review:x));setReviews(xs=>draft.__new?[...xs,data.review]:xs.map(x=>x.ReviewID===data.review.ReviewID?data.review:x));setDraft(null)}catch(e){alert(e.message)}};return <div><div className="page-title-row"><h2>Reviews</h2><button className="btn btn-primary" onClick={()=>setDraft({__new:true,CustomerName:"",Rating:5,Text:"",PhotoURL:"",DisplayOnSite:"Y"})}><Plus size={15}/> Add review</button></div><div className="admin-table reviews-table">{rows.map(r=><div className="table-row" key={r.ReviewID}><span><strong>{r.CustomerName}</strong><small>{r.Text}</small></span><span>★ {r.Rating}</span><span>{r.DisplayOnSite}</span><span className="row-actions"><button className="icon-btn" onClick={()=>setDraft({...r})}><Pencil size={15}/></button><button className="icon-btn danger" onClick={async()=>{await deleteReview(r.ReviewID);setRows(xs=>xs.filter(x=>x.ReviewID!==r.ReviewID));setReviews(xs=>xs.filter(x=>x.ReviewID!==r.ReviewID))}}><Trash2 size={15}/></button></span></div>)}</div>{draft&&<Modal title={draft.__new?"Add review":"Edit review"} onClose={()=>setDraft(null)}><div className="form-grid"><label>Customer<input value={draft.CustomerName} onChange={e=>setDraft({...draft,CustomerName:e.target.value})}/></label><label>Rating<select value={draft.Rating} onChange={e=>setDraft({...draft,Rating:Number(e.target.value)})}>{[1,2,3,4,5].map(x=><option key={x}>{x}</option>)}</select></label><label>Testimonial<textarea value={draft.Text} onChange={e=>setDraft({...draft,Text:e.target.value})}/></label><label>Display<select value={draft.DisplayOnSite} onChange={e=>setDraft({...draft,DisplayOnSite:e.target.value})}><option>Y</option><option>N</option></select></label></div><button className="btn btn-primary" onClick={save}>Save review</button></Modal>}</div>}

function ContentAdmin({siteContent,setSiteContent}){const [draft,setDraft]=useState(siteContent),[saving,setSaving]=useState(false);useEffect(()=>setDraft(siteContent),[siteContent]);const save=async()=>{try{setSaving(true);for(const [key,value] of Object.entries(draft))await updateSiteContent(key,value);setSiteContent(draft);alert("Site content saved.")}catch(e){alert(e.message)}finally{setSaving(false)}};const grouped=Object.entries(draft).reduce((a,[k,v])=>{const page=k.startsWith("home_")?"Home":k.startsWith("about_")?"About":k.startsWith("contact_")?"Contact":k.startsWith("reviews_")?"Reviews":k.startsWith("nav_")?"Navigation":k.startsWith("cta_")?"Buttons":"Other";(a[page]??=[]).push([k,v]);return a},{});return <div className="content-editor">{Object.entries(grouped).map(([page,rows])=><Panel key={page} title={page}>{rows.map(([k,v])=><label key={k}><span>{k.replaceAll("_"," ")}</span><textarea rows={k.includes("text")?3:1} value={v??""} onChange={e=>setDraft({...draft,[k]:e.target.value})}/></label>)}</Panel>)}<button className="btn btn-primary" disabled={saving} onClick={save}>{saving?"Saving…":"Save all content"}</button></div>}

function SettingsAdmin({settings,setSettings}){const [draft,setDraft]=useState(settings),[saving,setSaving]=useState(false);useEffect(()=>setDraft(settings),[settings]);const fields=["CandleBoxPrice","DeliveryFeeFlat","DeliveryRadiusKm","MinLeadTimeHours","MaxLeadTimeDays","ShopOpenTime","ShopCloseTime","ShopNotificationEmail","ShopNotificationPhone"];const save=async()=>{try{setSaving(true);for(const key of fields)await updateSetting(key,draft[key]);setSettings(draft);alert("Settings saved.")}catch(e){alert(e.message)}finally{setSaving(false)}};return <div className="settings-form">{fields.map(k=><label key={k}>{k}<input value={draft[k]??""} onChange={e=>setDraft({...draft,[k]:e.target.value})}/></label>)}<div className="notice-box"><strong>Confirmed rules</strong><span>₹5 candle box, ₹60 delivery within 15 km, 2-hour minimum, 10-day maximum, shop hours 09:00–22:00.</span></div><button className="btn btn-primary" disabled={saving} onClick={save}>{saving?"Saving…":"Save settings"}</button></div>}

function PaymentAdmin(){return <div className="simple-admin"><div className="simple-icon"><WalletCards/></div><h2>Payment & Notifications</h2><p>The gateway and WhatsApp vendor are intentionally not hardcoded because the project specification leaves both choices open.</p><div className="notice-box"><strong>Use Edge Function secrets</strong><span>Store payment keys, WhatsApp credentials and email-provider secrets only in Supabase Edge Function environment variables. Never put them in the database or React environment variables.</span></div></div>}

function UsersAdmin({currentUserId}){const [rows,setRows]=useState([]),[draft,setDraft]=useState(null),[passwordUser,setPasswordUser]=useState(null),[password,setPassword]=useState("");const load=()=>fetchAdminUsers().then(setRows).catch(e=>alert(e.message));useEffect(load,[]);const create=async()=>{try{const data=await createAdminUser(draft);setRows(x=>[...x,data.user]);setDraft(null)}catch(e){alert(e.message)}};const changeRole=async(u,role)=>{try{const data=await updateAdminUser(u.UserID,{Role:role});setRows(xs=>xs.map(x=>x.UserID===u.UserID?data.user:x))}catch(e){alert(e.message)}};return <div><div className="page-title-row"><h2>Admin accounts</h2><button className="btn btn-primary" onClick={()=>setDraft({Username:"",Email:"",Password:"",Role:"client"})}><Plus size={15}/> Add account</button></div><div className="admin-table users-table">{rows.map(u=><div className="table-row" key={u.UserID}><span><strong>{u.Username}</strong><small>{u.AuthEmail}</small></span><span>{u.Role}</span><span className="row-actions"><select value={u.Role} onChange={e=>changeRole(u,e.target.value)} disabled={u.AuthUserID===currentUserId}><option>admin</option><option>client</option></select><button className="icon-btn" onClick={()=>{setPasswordUser(u);setPassword("")}}>Reset password</button>{u.AuthUserID!==currentUserId&&<button className="icon-btn danger" onClick={async()=>{if(confirm(`Delete ${u.Username}?`)){await deleteAdminUser(u.UserID);load()}}}><Trash2 size={15}/></button>}</span></div>)}</div>{draft&&<Modal title="Create dashboard account" onClose={()=>setDraft(null)}><div className="form-grid"><label>Username<input value={draft.Username} onChange={e=>setDraft({...draft,Username:e.target.value})}/></label><label>Auth email<input type="email" value={draft.Email} onChange={e=>setDraft({...draft,Email:e.target.value})}/></label><label>Password<input type="password" minLength="8" value={draft.Password} onChange={e=>setDraft({...draft,Password:e.target.value})}/></label><label>Role<select value={draft.Role} onChange={e=>setDraft({...draft,Role:e.target.value})}><option>admin</option><option>client</option></select></label></div><button className="btn btn-primary" onClick={create}>Create account</button></Modal>}{passwordUser&&<Modal title={`Reset password for ${passwordUser.Username}`} onClose={()=>setPasswordUser(null)}><label>New password<input type="password" minLength="8" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn btn-primary" onClick={async()=>{try{await resetAdminPassword(passwordUser.UserID,password);alert("Password reset.");setPasswordUser(null)}catch(e){alert(e.message)}}}>Reset password</button></Modal>}</div>}

function OrdersTable({orders}){return <div className="mini-list">{orders.map(o=><div key={o.OrderID}><span><strong>{o.OrderID}</strong><small>{o.CustomerName} · ₹{o.TotalAmount}</small></span><b>{o.OrderStatus}</b></div>)}{!orders.length&&<Empty text="No orders yet."/>}</div>}
function Modal({title,onClose,children}){return <div className="omc-modal-backdrop"><div className="omc-modal"><div className="dash-panel-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>{children}</div></div>}