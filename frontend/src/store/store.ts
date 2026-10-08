import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { authApi } from "@/services/api/authApi";
import { censusApi } from "@/services/api/censusApi";

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
      [censusApi.reducerPath]: censusApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware, censusApi.middleware),
  });

  // Logging out — however it happens — must drop the previous account's
  // cached census data so the next login cannot flash another role's rows.
  // Update the flag before dispatching: the nested dispatch re-runs listeners.
  let wasAuthenticated = store.getState().auth.accessToken !== null;
  store.subscribe(() => {
    const authenticated = store.getState().auth.accessToken !== null;
    const previously = wasAuthenticated;
    wasAuthenticated = authenticated;
    if (previously && !authenticated) {
      store.dispatch(censusApi.util.resetApiState());
    }
  });

  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
