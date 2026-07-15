// Thin REST client for the avatar-system backend module.
// Configure once at app start:
//   configureAvatarApi({
//     baseUrl: 'https://<your-api>/api/v1/avatar-system',
//     getToken: async () => (await supabase.auth.getSession()).data.session?.access_token,
//   });
let cfg = {
  baseUrl: '',
  getToken: async () => null,
};

export function configureAvatarApi(options) {
  cfg = { ...cfg, ...options };
}

async function req(path, { method = 'GET', body } = {}) {
  if (!cfg.baseUrl) throw new Error('avatar api not configured — call configureAvatarApi()');
  const token = await cfg.getToken();
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || `avatar api ${res.status}`);
    err.status = res.status;
    err.details = json.details;
    throw err;
  }
  return json;
}

export const AvatarApi = {
  manifest: () => req('/catalog/manifest'),
  myAvatar: () => req('/avatar/me'),
  saveRecipe: (recipe) => req('/avatar/me', { method: 'PUT', body: { recipe } }),
  uploadSnapshots: (snaps) => req('/avatar/me/snapshots', { method: 'POST', body: snaps }),
  card: (userId) => req(`/avatar/card/${userId}`),
  inventory: () => req('/inventory/me'),
  progression: () => req('/progression/me'),
  claimLogin: () => req('/progression/login/claim', { method: 'POST' }),
  stats: () => req('/stats/me'),
};

// shop + gifting
AvatarApi.shop = () => req('/shop');
AvatarApi.purchase = (itemId, currency) =>
  req('/shop/purchase', { method: 'POST', body: { itemId, currency } });
AvatarApi.giftsPending = () => req('/gifts/me');
AvatarApi.sendGift = (itemId, toUserId, message) =>
  req('/gifts', { method: 'POST', body: { itemId, toUserId, message } });
AvatarApi.openGift = (giftId) => req(`/gifts/${giftId}/open`, { method: 'POST' });
