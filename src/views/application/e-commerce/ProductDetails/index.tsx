'use client';

// next
import { useParams, usePathname } from 'next/navigation';

import { useEffect, useState, SyntheticEvent } from 'react';

// material-ui
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import ProductImages from './ProductImages';
import ProductInfo from './ProductInfo';
import ProductDescription from './ProductDescription';
import ProductReview from './ProductReview';
import RelatedProducts from './RelatedProducts';

import MainCard from 'ui-component/cards/MainCard';
import FloatingCart from 'ui-component/cards/FloatingCart';

import { dispatch, useSelector } from 'store';
import { gridSpacing } from 'store/constant';
import { resetCart } from 'store/slices/cart';

// types
import { DefaultRootStateProps, TabsProps } from 'types';
import { getProduct } from 'store/slices/product';
import Loader from 'ui-component/Loader';
import { handlerActiveItem, useGetMenuMaster } from 'api/menu';

function TabPanel({ children, value, index, ...other }: TabsProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`product-details-tabpanel-${index}`}
      aria-labelledby={`product-details-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </Box>
  );
}

function a11yProps(index: number) {
  return {
    id: `product-details-tab-${index}`,
    'aria-controls': `product-details-tabpanel-${index}`
  };
}

export default function ProductDetails() {
  const { id } = useParams();
  const { menuMaster } = useGetMenuMaster();

  const cart = useSelector((state: DefaultRootStateProps) => state.cart);
  const { product } = useSelector((state) => state.product);

  const [loading, setLoading] = useState<boolean>(true);

  // product description tabs
  const [value, setValue] = useState(0);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    // clear cart if complete order
    if (cart.checkout.step > 2) {
      dispatch(resetCart());
    }
  }, [id, cart.checkout.step]);

  useEffect(() => {
    dispatch(getProduct(id as string)).then(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (menuMaster.openedItem !== 'product-details') handlerActiveItem('product-details');
    // eslint-disable-next-line
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (loading) return <Loader />;

  return (
    <>
      {product && Number(product.id) === Number(id) && (
        <Grid container spacing={gridSpacing} sx={{ alignItems: 'center', justifyContent: 'center' }}>
          <Grid size={{ xs: 12, lg: 10 }}>
            <MainCard>
              <Grid container spacing={gridSpacing}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ProductImages product={product} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ProductInfo product={product} />
                </Grid>
                <Grid size={12}>
                  <Tabs
                    value={value}
                    indicatorColor="primary"
                    onChange={handleChange}
                    aria-label="product description tabs example"
                    variant="scrollable"
                  >
                    <Tab label="Description" {...a11yProps(0)} />
                    <Tab
                      label={
                        <Stack direction="row" sx={{ alignItems: 'center' }}>
                          Reviews <Chip label={String(product.offerPrice?.toFixed(0))} size="small" color="secondary" sx={{ ml: 1.5 }} />
                        </Stack>
                      }
                      {...a11yProps(1)}
                    />
                  </Tabs>
                  <TabPanel value={value} index={0}>
                    <ProductDescription />
                  </TabPanel>
                  <TabPanel value={value} index={1}>
                    <ProductReview product={product} />
                  </TabPanel>
                </Grid>
              </Grid>
            </MainCard>
          </Grid>
          <Grid sx={{ mt: 3 }} size={{ xs: 12, lg: 10 }}>
            <Typography variant="h2">Related Products</Typography>
          </Grid>
          <Grid size={{ xs: 11, lg: 10 }}>
            <RelatedProducts id={id as string} />
          </Grid>
          <FloatingCart />
        </Grid>
      )}
    </>
  );
}
