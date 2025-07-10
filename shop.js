const db = require('./database');
const config = require('./config');

class Shop {
  constructor() {
    this.items = config.SHOP_ITEMS;
  }

  async buyItem(userId, itemName, quantity = 1) {
    const user = await db.getUser(userId);
    if (!user) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    if (!(itemName in this.items)) {
      return { success: false, message: 'العنصر غير موجود' };
    }

    const price = this.items[itemName] * quantity;
    if (user.balance < price) {
      return { success: false, message: 'رصيدك غير كافي' };
    }

    await db.updateUserBalance(userId, -price);
    await db.addUserItem(userId, itemName, quantity, this.items[itemName]);

    return {
      success: true,
      message: `لقد اشتريت ${quantity} ${itemName} بسعر ${price.toLocaleString()} د.ج 💵`,
      remainingBalance: user.balance - price
    };
  }

  async sellItem(userId, itemName, quantity = 1) {
    const userItems = await db.getUserItems(userId);
    const item = userItems.find(i => i.item_name === itemName);

    if (!item || item.quantity < quantity) {
      return { success: false, message: 'لا تملك هذا العنصر بالكمية المطلوبة' };
    }

    const sellPrice = Math.floor(item.purchase_price * 0.75) * quantity;
    await db.updateUserBalance(userId, sellPrice);

    // تحديث الكمية أو حذف العنصر
    if (item.quantity === quantity) {
      await db.db.run('DELETE FROM user_items WHERE user_id = ? AND item_name = ?', [userId, itemName]);
    } else {
      await db.db.run('UPDATE user_items SET quantity = quantity - ? WHERE user_id = ? AND item_name = ?', 
        [quantity, userId, itemName]);
    }

    return {
      success: true,
      message: `لقد بعت ${quantity} ${itemName} واسترجعت ${sellPrice.toLocaleString()} د.ج 💰`,
      sellPrice
    };
  }

  async getUserItems(userId) {
    return await db.getUserItems(userId);
  }

  getShopItems() {
    return this.items;
  }

  formatShopMessage() {
    let message = '🛒 **متجر البوت**\n\n';
    
    for (const [itemName, price] of Object.entries(this.items)) {
      message += `• ${itemName}: ${price.toLocaleString()} د.ج\n`;
    }
    
    message += '\n💡 استخدم الأمر: شراء [الكمية] [اسم العنصر]\n';
    message += '💡 مثال: شراء 1 تبون';
    
    return message;
  }
}

module.exports = new Shop();
