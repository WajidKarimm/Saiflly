'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { PropertyWithScore } from '../../types';

export const useProperties = (latitude: number, longitude: number, radiusKm: number = 5) => {
  const [page, setPage] = useState(1);

  const { data, isLoading, error, isPlaceholderData, refetch } = useQuery({
    queryKey: ['properties', latitude, longitude, radiusKm, page],
    queryFn: () => apiClient.searchProperties(latitude, longitude, radiusKm, page),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    properties: data?.data?.properties || [],
    pagination: data?.data?.pagination,
    isLoading,
    error,
    isPlaceholderData,
    page,
    nextPage,
    prevPage,
    resetPage,
    refetch,
  };
};

export const usePropertyDetail = (propertyId: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => apiClient.getPropertyDetail(propertyId),
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    property: data?.data?.property,
    safetyScore: data?.data?.safety_score,
    aiVerdict: data?.data?.ai_verdict,
    isLoading,
    error,
    refetch,
  };
};
