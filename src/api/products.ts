import axios from '@/utils/axios';

type ProductsFilter = any;

export async function filterProducts(filter: ProductsFilter) {
  return await axios.post('/api/products/filter', { filter });
}

export async function getRelatedProducts(id: string | undefined) {
  return await axios.post('/api/product/related', { id });
}

export async function getProductReviews() {
  return await axios.get('/api/review/list');
}
