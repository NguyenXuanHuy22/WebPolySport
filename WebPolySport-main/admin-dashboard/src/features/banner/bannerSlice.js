import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = "http://localhost:5000/api/banners";

// Lấy tất cả banner
export const fetchBanners = createAsyncThunk("banner/fetchBanners", async () => {
  const res = await axios.get(BASE_URL);
  return res.data; // [{_id, image: "..."}]
});

// Thêm banner (ảnh đã là base64 string)
export const addBanner = createAsyncThunk("banner/addBanner", async (bannerData) => {
  const res = await axios.post(BASE_URL, bannerData, {
    headers: { "Content-Type": "application/json" }
  });
  return res.data;
});

// Xóa banner
export const deleteBanner = createAsyncThunk("banner/deleteBanner", async (id) => {
  await axios.delete(`${BASE_URL}/${id}`);
  return id;
});

const bannerSlice = createSlice({
  name: "banner",
  initialState: {
    banners: [],
    status: "idle", // idle | loading | succeeded | failed
    error: null,
    addStatus: "idle", // trạng thái khi thêm banner
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch banners
      .addCase(fetchBanners.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.banners = action.payload;
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })

      // Add banner
      .addCase(addBanner.pending, (state) => {
        state.addStatus = "loading";
      })
      .addCase(addBanner.fulfilled, (state, action) => {
        state.addStatus = "succeeded";
        state.banners.unshift(action.payload);
      })
      .addCase(addBanner.rejected, (state, action) => {
        state.addStatus = "failed";
        state.error = action.error.message;
      })

      // Delete banner
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.banners = state.banners.filter((b) => b._id !== action.payload);
      });
  },
});

export default bannerSlice.reducer;
