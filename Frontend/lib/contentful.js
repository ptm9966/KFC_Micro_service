const CONTENTFUL_DELIVERY_API_BASE = 'https://cdn.contentful.com/spaces';
const CONTENTFUL_MANAGEMENT_API_BASE = 'https://api.contentful.com/spaces';

function getLocalizedValue(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  return value['en-US'] || value[Object.keys(value)[0]] || '';
}

function getAssetUrl(asset, assets) {
  const assetId = typeof asset === 'string' ? asset : asset?.sys?.id;
  const linkedAsset = assets[assetId] || asset;
  const rawFile = getLocalizedValue(linkedAsset?.fields?.file);
  const rawUrl = rawFile?.url || rawFile?.upload
    || getLocalizedValue(linkedAsset?.fields?.image)?.url
    || linkedAsset?.url;

  if (!rawUrl) return '';
  return rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
}

function getField(fields, names, fallback = '') {
  const fieldName = names.find((name) => fields[name] !== undefined && fields[name] !== null);
  return fieldName ? getLocalizedValue(fields[fieldName]) : fallback;
}

function normalizeItem(entry, assets) {
  const fields = entry.fields || {};
  const image = getField(fields, ['image', 'imageUrl', 'photo']);
  const category = getField(fields, ['category']);
  const price = getField(fields, ['price', 'cost'], 0);

  return {
    _id: entry.sys?.id,
    title: getField(fields, ['title', 'name'], 'KFC item'),
    desc: getField(fields, ['description', 'desc'], 'Freshly prepared with signature KFC flavour.'),
    price: Number(price) || 0,
    image: getAssetUrl(image, assets) || (typeof image === 'string' ? image : ''),
    categoryId: category?.sys?.id || '',
    categoryName: category?.fields?.name || '',
    categories: category?.fields?.name || '',
    serve: getField(fields, ['serve', 'serves']),
    type: getField(fields, ['type']),
    isAvailable: getField(fields, ['isAvailable'], true),
  };
}

async function fetchContentfulEntries(contentType) {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
  const environment = process.env.CONTENTFUL_ENVIRONMENT || 'master';
  const isManagementToken = accessToken.startsWith('CFPAT-');
  const apiBase = isManagementToken ? CONTENTFUL_MANAGEMENT_API_BASE : CONTENTFUL_DELIVERY_API_BASE;
  const url = new URL(`${apiBase}/${spaceId}/environments/${environment}/entries`);

  url.searchParams.set('content_type', contentType);
  url.searchParams.set('include', '2');
  if (contentType === 'menuItem') url.searchParams.set('order', 'fields.title');

  const response = await fetch(url, {
    headers: isManagementToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`Contentful ${contentType} request failed: ${response.status}`);
  return response.json();
}

export async function getMenuItems() {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
  const contentType = process.env.CONTENTFUL_MENU_CONTENT_TYPE || 'menuItem';

  if (!spaceId || !accessToken) {
    console.warn('Contentful menu is not configured. Set CONTENTFUL_SPACE_ID and CONTENTFUL_ACCESS_TOKEN.');
    return [];
  }

  const data = await fetchContentfulEntries(contentType);
  const assets = Object.fromEntries(
    (data.includes?.Asset || []).map((asset) => [asset.sys.id, asset]),
  );

  return (data.items || [])
    .map((entry) => normalizeItem(entry, assets))
    .filter((item) => item.isAvailable !== false);
}

export async function getMenuCategories() {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

  if (!spaceId || !accessToken) return [];

  const data = await fetchContentfulEntries('menuCategory');
  return (data.items || [])
    .map((entry) => {
      const fields = entry.fields || {};
      return {
        _id: entry.sys?.id,
        name: getField(fields, ['name'], 'Menu'),
        code: getField(fields, ['code']),
        displayOrder: Number(getField(fields, ['displayOrder'], 999)),
        isActive: getField(fields, ['isActive'], true),
      };
    })
    .filter((category) => category.isActive !== false)
    .sort((first, second) => first.displayOrder - second.displayOrder);
}