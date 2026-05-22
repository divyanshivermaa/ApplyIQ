import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import LoadingState from "../components/common/LoadingState";

export default function AppLayout() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<LoadingState text="Loading page..." />}>
        <Outlet />
      </Suspense>
    </>
  );
}
