import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axiosInstance';

// Lấy danh sách đơn hàng
export const fetchOrders = createAsyncThunk('order/fetchOrders', async () => {
  const res = await axios.get('/orders');
  return res.data;
});

// Cập nhật trạng thái (không phải huỷ)
export const updateOrderStatus = createAsyncThunk(
  'order/updateOrderStatus',
  async ({ orderId, newStatus }) => {
    const res = await axios.patch(`/orders/${orderId}/status`, { status: newStatus });
    return res.data;
  }
);

// Huỷ đơn hàng có lý do
export const cancelOrder = createAsyncThunk(
  'order/cancelOrder',
  async ({ orderId, cancelNote }) => {
    const res = await axios.patch(`/orders/${orderId}/cancel`, { cancelNote });
    return res.data;
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        state.data = state.data.map((o) => (o._id === updated._id ? updated : o));
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const updated = action.payload;
        state.data = state.data.map((o) => (o._id === updated._id ? updated : o));
      });
  },
});

export default orderSlice.reducer;
