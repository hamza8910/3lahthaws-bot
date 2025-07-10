const db = require('./database');
const config = require('./config');

class Banking {
  constructor() {
    this.banks = config.BANKS;
  }

  async createAccount(userId, bankName) {
    if (!this.banks.includes(bankName)) {
      return { success: false, message: 'البنك غير موجود' };
    }

    const user = await db.getUser(userId);
    if (!user) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    if (user.bank_account) {
      return { success: false, message: 'لديك حساب بنكي بالفعل' };
    }

    const accountNumber = this.generateAccountNumber();
    await db.createBankAccount(userId, bankName, accountNumber);

    return {
      success: true,
      message: `تم فتح الحساب، رصيدك 0 د.ج، ورقم الحساب: ${accountNumber}`,
      accountNumber,
      bankName
    };
  }

  async transfer(fromUserId, toAccountNumber, amount) {
    const fromUser = await db.getUser(fromUserId);
    if (!fromUser) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    if (!fromUser.bank_account) {
      return { success: false, message: 'يجب أن يكون لديك حساب بنكي أولاً' };
    }

    if (fromUser.balance < amount) {
      return { success: false, message: 'رصيدك غير كافي' };
    }

    // البحث عن المستفيد
    const toUser = await new Promise((resolve, reject) => {
      db.db.get('SELECT * FROM users WHERE bank_account = ?', [toAccountNumber], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!toUser) {
      return { success: false, message: 'رقم الحساب غير موجود' };
    }

    if (fromUser.id === toUser.id) {
      return { success: false, message: 'لا يمكن تحويل الأموال لنفسك' };
    }

    // خصم العمولة 15%
    const commission = Math.floor(amount * 0.15);
    const finalAmount = amount - commission;

    await db.updateUserBalance(fromUserId, -amount);
    await db.updateUserBalance(toUser.id, finalAmount);

    return {
      success: true,
      message: `تم تحويل ${finalAmount.toLocaleString()} د.ج إلى ${toUser.first_name}\nالعمولة: ${commission.toLocaleString()} د.ج`,
      transferredAmount: finalAmount,
      commission
    };
  }

  generateAccountNumber() {
    const part1 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const part2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${part1}-${part2}`;
  }

  getBanks() {
    return this.banks;
  }
}

module.exports = new Banking();
