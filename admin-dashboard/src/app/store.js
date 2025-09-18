import { configureStore } from '@reduxjs/toolkit';
import { productReducer } from '../features';
import productDetailReducer from '../features/product/productDetailSlice';
import orderReducer from '../features/product/orderSlice';
import authReducer from '../features/auth/authSlice';
import usersReducer from '../features/users/userSlice';
import bannerReducer from "../features/banner/bannerSlice";


export const store = configureStore({
  reducer: {
    product: productReducer,
    productDetail: productDetailReducer, 
    order: orderReducer,
    auth: authReducer,
    users: usersReducer, 
    banner: bannerReducer,
 },
});