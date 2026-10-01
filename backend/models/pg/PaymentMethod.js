module.exports = (sequelize, DataTypes) => {
  const PaymentMethod = sequelize.define('PaymentMethod', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Card type: 'credit' or 'debit'
    cardType: {
      type: DataTypes.ENUM('credit', 'debit'),
      allowNull: false,
      defaultValue: 'debit'
    },
    // Masked card number (last 4 digits only) - e.g., "**** **** **** 1234"
    cardNumberLast4: {
      type: DataTypes.STRING(4),
      allowNull: false
    },
    // Full card number (encrypted in production, stored for demo purposes)
    // NOTE: In production, this should be encrypted or tokenized via payment provider
    cardNumber: {
      type: DataTypes.STRING(19),
      allowNull: false
    },
    // Cardholder name as shown on card
    cardholderName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    // Expiry date in MM/YY format
    expiryDate: {
      type: DataTypes.STRING(5),
      allowNull: false
    },
    // CVV/CVC (should be encrypted in production)
    cvv: {
      type: DataTypes.STRING(4),
      allowNull: false
    },
    // Card brand (Visa, Mastercard, etc.)
    cardBrand: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    // Whether this is the default payment method
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Nickname for the card (e.g., "My Visa", "Personal Card")
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'payment_methods',
    timestamps: true
  });

  return PaymentMethod;
};
