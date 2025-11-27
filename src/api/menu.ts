import useSWR, { mutate } from 'swr';
import { useMemo } from 'react';

// project imports
import { fetcher } from '@/utils/axios';

// local types to avoid pulling template type barrels
type NavItemType = any;
type MenuProps = { openedItem: string; isDashboardDrawerOpened: boolean };

const initialState: MenuProps = {
  openedItem: 'dashboard',
  isDashboardDrawerOpened: false
};

const endpoints = {
  key: 'api/menu',
  master: 'master',
  widget: '/widget' // server URL
};

export function useGetMenu() {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + endpoints.widget, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      menu: data?.widget as NavItemType,
      menuLoading: isLoading,
      menuError: error,
      menuValidating: isValidating,
      menuEmpty: !isLoading && !data?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetMenuMaster() {
  const { data, isLoading } = useSWR(endpoints.key + endpoints.master, () => initialState, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      menuMaster: data as MenuProps,
      menuMasterLoading: isLoading
    }),
    [data, isLoading]
  );

  return memoizedValue;
}

export function handlerDrawerOpen(isDashboardDrawerOpened: boolean) {
  // to update local state based on key

  mutate(
    endpoints.key + endpoints.master,
    (currentMenuMaster: any) => {
      return { ...currentMenuMaster, isDashboardDrawerOpened };
    },
    false
  );
}

export function handlerActiveItem(openedItem: string) {
  // to update local state based on key

  mutate(
    endpoints.key + endpoints.master,
    (currentMenuMaster: any) => {
      return { ...currentMenuMaster, openedItem };
    },
    false
  );
}
