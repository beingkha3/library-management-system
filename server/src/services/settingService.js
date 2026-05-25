import { SystemSetting } from '../models/SystemSetting.js';

const defaultSettings = {
  loanDays: 14,
  finePerDay: 10,
  maxActiveBorrows: 5,
  maxRenewals: 2,
  reservationHoldDays: 3,
  fineThreshold: 500,
  allowSelfIssue: true
};

export const getSettings = async () => {
  let settings = await SystemSetting.findOne({ key: 'system' });

  if (!settings) {
    settings = await SystemSetting.create({ key: 'system', ...defaultSettings });
  }

  return settings;
};

export const updateSettings = async (payload) => {
  const settings = await getSettings();
  Object.assign(settings, payload);
  await settings.save();
  return settings;
};
