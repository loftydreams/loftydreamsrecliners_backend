const { db } = require("./firebase-admin");

const sp = (price, dis) => {
  return price - (price * dis) / 100;
};

const calcPrice = async (items) => {
  let updatedItems = [];
  let totalPrice = 0;

  await Promise.all(
    items.map(async (item) => {
      const docRef = db.collection("products").doc(item.id);
      const doc = await docRef.get();

      if (doc.exists) {
        const { price, discount } = doc.data();
        const newPrice = sp(price, discount);
        totalPrice += newPrice * item.quantity;
        const updatedItem = {
          ...item,
          price: newPrice,
        };
        updatedItems.push(updatedItem);
      }
    })
  );

  return { updatedItems, totalPrice };
};

module.exports = { calcPrice };
