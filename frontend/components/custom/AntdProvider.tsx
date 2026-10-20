"use client";

import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App, theme } from "antd";

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#14b8a6",
            colorBgBase: "#0b1329",
            colorBgContainer: "#101b3b",
            colorBorder: "#1e293b",
            colorText: "#f1f5f9",
            colorTextSecondary: "#94a3b8",
            borderRadius: 8,
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
