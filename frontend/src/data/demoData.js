export const siteContent = {
  home_eyebrow: "Baked with love in small batches",
  home_title: "Sweet moments deserve a beautiful cake.",
  home_subtext: "Fresh cakes, cookies and cupcakes made for birthdays, celebrations and everyday little joys.",
  home_bestsellers_title: "Bestsellers",
  home_categories_title: "Pick your sweet",
  home_custom_title: "Have something special in mind?",
  home_custom_text: "Tell us your dream cake. Custom cakes are handled personally by our team — no online pricing or payment.",
  about_title: "A little sweetness from our kitchen",
  about_text: "Oh My Cake by Abi is a home pastry shop focused on thoughtful bakes, celebration cakes and made-to-order treats.",
  reviews_title: "Sweet words from our customers",
  contact_title: "Come say hello",
  footer_text: "Oh My Cake by Abi · Freshly baked, thoughtfully made.",
  nav_home: "Home",
  nav_about: "About Us",
  nav_custom: "Custom Cakes",
  nav_reviews: "Reviews",
  nav_contact: "Contact",
  nav_cart: "Cart",
  cta_shop: "Shop the menu",
  cta_custom: "Request a custom cake"
};

const image = (label, tone = "rose") =>
  `/images/${tone}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`;

const cakeNames = [
  ["Chocolate Truffle",325,true,"Rich chocolate sponge with smooth truffle ganache."],
  ["Red Velvet",375,true,"Velvety cocoa cake with creamy frosting."],
  ["Black Forest",300,false,"Chocolate sponge, cherry filling and whipped cream."],
  ["Butterscotch",300,false,"Classic butterscotch cake with caramel crunch."],
  ["Pineapple",275,false,"Light pineapple cake with a bright fruity finish."],
  ["Vanilla Sponge",250,false,"Soft vanilla sponge with delicate cream."],
  ["Fresh Fruit Cake",400,true,"Seasonal fruits layered over a light cream cake."],
  ["Rasmalai Fusion",425,false,"Indian rasmalai flavours in a celebration cake."],
  ["Ferrero Rocher",475,true,"Chocolate-hazelnut indulgence inspired by the classic treat."],
  ["Photo Print Cake",400,false,"A celebration cake personalised with your photo."],
  ["Coffee Walnut",325,false,"Coffee sponge with roasted walnut crunch."]
];

const cookieNames = [
  ["Choco Chip",40,true],["Double Chocolate",45,false],["Butter Cookies",35,false],
  ["Oatmeal Raisin",40,false],["Red Velvet Cookies",50,true],["Peanut Butter",40,false],
  ["White Chocolate Macadamia",55,false],["Coconut Cookies",35,false],["Almond Cookies",45,false],
  ["Ragi Cookies",40,false],["Jam Filled Cookies",45,true]
];

const cupcakeNames = [
  ["Vanilla",60,false],["Chocolate",65,true],["Red Velvet",75,true],
  ["Oreo",70,false],["Blueberry",80,false],["Salted Caramel",85,false],
  ["Butterscotch",70,false],["Black Forest",75,false],["Lemon Zest",70,false],
  ["Nutella",80,true],["Rainbow Sprinkle",65,false]
];

export const products = [
  ...cakeNames.map(([name, price, bestseller, description], i) => ({
    ProductID: `CAKE-${String(i + 1).padStart(3, "0")}`,
    Category: "Cake", Name: name, Description: description,
    PricePer500g: price, PricePerPiece: null, ImageURL: image(name, "cake"),
    InStock: null, Bestseller: bestseller ? "Y" : "N",
    stock: [
      ...(i % 3 !== 0 ? [{ weight: 500, units: i % 4 + 1 }] : []),
      ...(i % 2 === 0 ? [{ weight: 1000, units: i % 3 + 1 }] : [])
    ]
  })),
  ...cookieNames.map(([name, price, bestseller], i) => ({
    ProductID: `COOK-${String(i + 1).padStart(3, "0")}`,
    Category: "Cookie", Name: name,
    Description: `Freshly baked ${name.toLowerCase()} cookies with a crisp edge and soft centre.`,
    PricePer500g: null, PricePerPiece: price, ImageURL: image(name, "cookie"),
    InStock: i !== 7 ? "Y" : "N", Bestseller: bestseller ? "Y" : "N"
  })),
  ...cupcakeNames.map(([name, price, bestseller], i) => ({
    ProductID: `CUP-${String(i + 1).padStart(3, "0")}`,
    Category: "Cupcake", Name: name,
    Description: `A single ${name.toLowerCase()} cupcake, finished for easy celebration.`,
    PricePer500g: null, PricePerPiece: price, ImageURL: image(name, "cupcake"),
    InStock: i !== 8 ? "Y" : "N", Bestseller: bestseller ? "Y" : "N"
  }))
];

export const reviews = [
  { ReviewID:"REV-001", CustomerName:"Priya", Rating:5, Text:"The cake looked beautiful and tasted even better. Everyone loved it!", DisplayOnSite:"Y" },
  { ReviewID:"REV-002", CustomerName:"Aarav", Rating:5, Text:"The chocolate truffle was rich, fresh and exactly what we wanted.", DisplayOnSite:"Y" },
  { ReviewID:"REV-003", CustomerName:"Nisha", Rating:4, Text:"Lovely cupcakes and very neat packaging. Will order again.", DisplayOnSite:"Y" }
];

export const offers = [
  { OfferID:"OFF-001", Code:"ABI10", DiscountType:"percent", DiscountValue:10, MinOrderValue:500, ValidFrom:"2026-01-01", ValidTo:"2030-12-31", UsageLimit:100, TimesUsed:0, Active:"Y" },
  { OfferID:"OFF-002", Code:"SAVE50", DiscountType:"flat", DiscountValue:50, MinOrderValue:700, ValidFrom:"2026-01-01", ValidTo:"2030-12-31", UsageLimit:50, TimesUsed:0, Active:"Y" }
];

export const settings = {
  CandleBoxPrice: 5,
  DeliveryFeeFlat: 60,
  DeliveryRadiusKm: 15,
  MinLeadTimeHours: 2,
  MaxLeadTimeDays: 10,
  ShopOpenTime: "09:00",
  ShopCloseTime: "22:00",
  ShopNotificationEmail: "hello@ohmycake.example",
  ShopNotificationPhone: "+91 90000 00000"
};

export const demoOrders = [
  {
    OrderID:"ORD-20260819-001", Timestamp:"2026-08-19T11:20:00+05:30",
    CustomerName:"Demo Customer", Phone:"+91 98765 43210", Email:"customer@example.com",
    FulfillmentType:"Pickup", Address:"", MapLink:"", DeliveryFee:0, CandleBoxCount:1,
    PaymentMode:"Pay at Store", PaymentStatus:"Awaiting Payment at Pickup",
    OrderStatus:"New", Occasion:"Birthday", DateNeeded:"2026-08-20", TimeNeeded:"17:30", TotalAmount:705,
    items:[{ProductID:"CAKE-001",Name:"Chocolate Truffle",Weight:1000,Qty:2,ItemPrice:650,CakeMessage:"Happy Birthday"}]
  }
];

export const customRequests = [
  {
    RequestID:"REQ-20260819-001", Timestamp:"2026-08-19T10:10:00+05:30",
    CustomerName:"Demo Customer", Phone:"+91 98765 43210", Email:"customer@example.com",
    Occasion:"Birthday", Flavor:"Rasmalai", Qty:1, Weight:1000, DateNeeded:"2026-08-22",
    TimeNeeded:"18:00", Description:"A pastel themed cake with a simple floral finish.",
    ReferenceImageURL:"", FulfillmentType:"Pickup", Address:"", Status:"New"
  }
];
