import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { api } from './api.js'

export const dashboardQuery = () =>
  queryOptions({
    queryKey: ['dashboard'],
    queryFn: ({ signal }) => api.dashboard(signal),
  })

export const transactionsQuery = (params) =>
  queryOptions({
    queryKey: ['transactions', params],
    queryFn: ({ signal }) => api.transactions(params, signal),
    placeholderData: keepPreviousData,
  })

export const usersQuery = (params) =>
  queryOptions({
    queryKey: ['users', params],
    queryFn: ({ signal }) => api.users(params, signal),
    placeholderData: keepPreviousData,
  })
