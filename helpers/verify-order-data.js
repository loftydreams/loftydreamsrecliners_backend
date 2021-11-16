const verifyOrderData = (orderData) => {
  if (
    !orderData.customerData &&
    !orderData.shippingAddress &&
    !orderData.itemsToPurchase
  ) {
    return false;
  }
  if (
    !orderData.customerData.name &&
    !orderData.customerData.email &&
    !orderData.customerData.phone
  ) {
    return false;
  }
  if (
    !orderData.shippingAddress.address &&
    !orderData.shippingAddress.city &&
    !orderData.shippingAddress.state &&
    !orderData.shippingAddress.zip
  ) {
    return false;
  }
  if (!orderData.itemsToPurchase.length) {
    return false;
  }
  return orderData;
};

module.exports = { verifyOrderData };
