const UserModel = require('./User');
const SessionModel = require('./AuthSession');
const TokenModel = require('./Token');

function wrap(document) {
  if (!document) return null;
  document.update = async (changes) => { document.set(changes); await document.save(); return document; };
  document.destroy = async () => document.deleteOne();
  return document;
}
function where(query = {}) {
  const result = { ...query };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (value && typeof value === 'object') {
      const symbol = Object.getOwnPropertySymbols(value).find(item => String(item.description).toLowerCase().includes('in'));
      if (symbol) result[key] = { $in: value[symbol] };
    }
  }
  return result;
}
function modelStore(Model, mapsUserId = false) {
  function wrapResult(document) {
    const result = wrap(document);
    if (mapsUserId && result) Object.defineProperty(result, 'userId', { value: String(result.user), enumerable: false, configurable: true });
    return result;
  }
  function normalizeFilter(filter = {}) {
    const normalized = where(filter);
    if (mapsUserId && normalized.userId) {
      normalized.user = normalized.userId;
      delete normalized.userId;
    }
    return normalized;
  }
  function normalizeData(data = {}) {
    const normalized = { ...data };
    if (mapsUserId && normalized.userId) {
      normalized.user = normalized.userId;
      delete normalized.userId;
    }
    return normalized;
  }
  return {
    findOne: async ({ where: filter = {} } = {}) => wrapResult(await Model.findOne(normalizeFilter(filter)).select('+passwordHash +twoFactorSecret +backupCodes')),
    findByPk: async id => wrapResult(await Model.findById(id).select('+passwordHash +twoFactorSecret +backupCodes')),
    create: async data => wrapResult(await Model.create(normalizeData(data))),
    update: async (values, { where: filter = {} } = {}) => { await Model.updateMany(normalizeFilter(filter), normalizeData(values)); },
    findAll: async ({ where: filter = {}, order = [] } = {}) => {
      let query = Model.find(normalizeFilter(filter));
      for (const [field, direction] of order) query = query.sort({ [field]: direction === 'DESC' ? -1 : 1 });
      const documents = await query;
      return documents.map(wrapResult);
    }
  };
}

module.exports = {
  User: modelStore(UserModel),
  AuthSession: modelStore(SessionModel, true),
  AuthToken: modelStore(TokenModel, true)
};
