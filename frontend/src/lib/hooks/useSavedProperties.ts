'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export const useSavedProperties = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['savedProperties', page],
    queryFn: () => apiClient.getSavedProperties(page),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const savePropertyMutation = useMutation({
    mutationFn: (payload: { propertyId: string; notes?: string }) =>
      apiClient.saveProperty(payload.propertyId, payload.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedProperties'] });
    },
  });

  const nextPage = useCallback(() => {
    if (data?.data?.pagination && page < data.data.pagination.pages) {
      setPage((prev) => prev + 1);
    }
  }, [data, page]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const saveProperty = useCallback(
    (propertyId: string, notes?: string) => {
      return savePropertyMutation.mutate({ propertyId, notes });
    },
    [savePropertyMutation]
  );

  return {
    properties: data?.data?.properties || [],
    pagination: data?.data?.pagination,
    isLoading: isLoading || savePropertyMutation.isPending,
    error: error || (savePropertyMutation.error as any),
    page,
    nextPage,
    prevPage,
    resetPage,
    saveProperty,
    isSaving: savePropertyMutation.isPending,
    refetch,
  };
};
