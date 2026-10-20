"use client";

import React, { useState } from "react";
import { Table, Tag, Progress as AntProgress, Popconfirm, message, Popover, Tooltip, Input, Select, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Eye, Trash2, Search, Filter, RefreshCw, FileText, Activity } from "lucide-react";
import { PredictionResult } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PredictionHistoryTableProps {
  data: PredictionResult[];
  total: number;
  loading: boolean;
  onRefresh: () => void;
  onSelectRecord: (record: PredictionResult) => void;
  onDeleteRecord: (scanId: string) => Promise<void>;
  onDeleteBatch?: (scanIds: string[]) => Promise<void>;
  onClearAll?: () => Promise<void>;
  onFilterChange: (category?: string, query?: string) => void;
}

export default function PredictionHistoryTable({
  data,
  total,
  loading,
  onRefresh,
  onSelectRecord,
  onDeleteRecord,
  onDeleteBatch,
  onClearAll,
  onFilterChange,
}: PredictionHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    onFilterChange(selectedClass === "ALL" ? undefined : selectedClass, val);
  };

  const handleClassSelect = (val: string) => {
    setSelectedClass(val);
    onFilterChange(val === "ALL" ? undefined : val, searchQuery);
  };

  const handleSelectAllOnPage = () => {
    const allKeys = data.map((r) => r.scan_id || String(r.id));
    setSelectedRowKeys(allKeys);
  };

  const handleDeselectAll = () => {
    setSelectedRowKeys([]);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  const columns: ColumnsType<PredictionResult> = [
    {
      title: "Scan ID",
      dataIndex: "scan_id",
      key: "scan_id",
      width: 140,
      render: (scanId: string, record: PredictionResult) => (
        <div className="flex items-center gap-2">
          {record.image_base64_thumbnail || record.thumbnail_b64 ? (
            <Popover
              content={
                <div className="p-1">
                  <img
                    src={record.image_base64_thumbnail || record.thumbnail_b64}
                    alt="Preview"
                    className="h-40 w-40 object-cover rounded border border-slate-700"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">{record.filename}</div>
                </div>
              }
              title="CT Slice Thumbnail"
              trigger="hover"
            >
              <img
                src={record.image_base64_thumbnail || record.thumbnail_b64}
                alt="Scan"
                className="h-8 w-8 rounded object-cover border border-slate-700 cursor-pointer hover:border-teal-400"
              />
            </Popover>
          ) : (
            <div className="h-8 w-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <Activity className="h-3.5 w-3.5" />
            </div>
          )}
          <span className="font-mono text-xs text-slate-300 font-medium">{scanId}</span>
        </div>
      ),
    },
    {
      title: "Patient / File",
      key: "patient",
      render: (_, record) => (
        <div>
          <div className="text-xs font-semibold text-white">
            {record.patient_id || "ANONYMOUS"}
          </div>
          <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
            {record.filename}
          </div>
        </div>
      ),
    },
    {
      title: "Diagnostic Outcome",
      dataIndex: "predicted_class",
      key: "predicted_class",
      width: 130,
      render: (cls: string) => {
        let tagColor = "default";
        if (cls === "Normal") tagColor = "success";
        if (cls === "Cyst") tagColor = "gold";
        if (cls === "Stone") tagColor = "purple";
        if (cls === "Tumor") tagColor = "error";
        if (cls === "Hydronephrosis") tagColor = "cyan";
        if (cls === "Polycystic Disease") tagColor = "geekblue";
        if (cls === "Pyelonephritis") tagColor = "orange";
        if (cls === "Renal Atrophy") tagColor = "default";

        return (
          <Tag color={tagColor} className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
            {cls}
          </Tag>
        );
      },
    },
    {
      title: "Confidence",
      dataIndex: "confidence",
      key: "confidence",
      width: 150,
      render: (confidence: number, record) => {
        let strokeColor = "#14b8a6";
        if (record.predicted_class === "Normal") strokeColor = "#10b981";
        if (record.predicted_class === "Cyst") strokeColor = "#f59e0b";
        if (record.predicted_class === "Stone") strokeColor = "#a855f7";
        if (record.predicted_class === "Tumor") strokeColor = "#f43f5e";
        if (record.predicted_class === "Hydronephrosis") strokeColor = "#06b6d4";
        if (record.predicted_class === "Polycystic Disease") strokeColor = "#6366f1";
        if (record.predicted_class === "Pyelonephritis") strokeColor = "#f97316";
        if (record.predicted_class === "Renal Atrophy") strokeColor = "#78716c";

        return (
          <div className="flex items-center gap-2">
            <AntProgress
              percent={confidence}
              size="small"
              strokeColor={strokeColor}
              trailColor="#1e293b"
              showInfo={false}
              className="m-0 flex-1"
            />
            <span className="font-mono text-xs font-medium text-slate-300">
              {confidence.toFixed(1)}%
            </span>
          </div>
        );
      },
    },
    {
      title: "Latency",
      dataIndex: "inference_time_ms",
      key: "inference_time_ms",
      width: 90,
      render: (ms: number) => (
        <span className="text-xs font-mono text-slate-400">{ms ? `${ms}ms` : "-"}</span>
      ),
    },
    {
      title: "Timestamp",
      dataIndex: "created_at",
      key: "created_at",
      render: (val: string) => (
        <span className="text-xs text-slate-400">{formatDateTime(val)}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: "right",
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip title="View Clinical Report">
            <button
              onClick={() => onSelectRecord(record)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors"
            >
              <Eye className="h-4 w-4" />
            </button>
          </Tooltip>

          <Popconfirm
            title="Delete prediction log"
            description="Are you sure you want to delete this scan entry from database?"
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              await onDeleteRecord(record.scan_id);
              message.success(`Scan ${record.scan_id} deleted.`);
            }}
          >
            <Tooltip title="Delete Record">
              <button className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-6 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">Diagnostic History &amp; Audit Logs</h3>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-mono text-teal-400">
              {total} Scans
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Securely persisted inference records with timestamps, confidence distributions, and patient metadata.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <Select
            defaultValue="ALL"
            value={selectedClass}
            onChange={handleClassSelect}
            className="w-40 text-xs"
            options={[
              { value: "ALL", label: "All Categories" },
              { value: "Normal", label: "Normal" },
              { value: "Cyst", label: "Cyst" },
              { value: "Stone", label: "Stone" },
              { value: "Tumor", label: "Tumor" },
              { value: "Hydronephrosis", label: "Hydronephrosis" },
              { value: "Polycystic Disease", label: "Polycystic (PKD)" },
              { value: "Pyelonephritis", label: "Pyelonephritis" },
              { value: "Renal Atrophy", label: "Renal Atrophy" },
            ]}
          />

          {/* Search Box */}
          <Input
            placeholder="Search patient, ID, file..."
            prefix={<Search className="h-3.5 w-3.5 text-slate-400" />}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            className="w-56 text-xs bg-slate-950/60 border-slate-700 text-white"
          />

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-8 border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Batch Actions & Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAllOnPage}
            className="h-7 text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            Select All
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeselectAll}
              className="h-7 text-xs text-slate-400 hover:text-white"
            >
              Clear Selection
            </Button>
          )}
          <span className="text-xs text-slate-400 font-mono">
            {selectedRowKeys.length > 0
              ? `${selectedRowKeys.length} of ${data.length} selected`
              : "0 selected (use checkboxes or 'Select All')"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedRowKeys.length > 0 && onDeleteBatch && (
            <Popconfirm
              title={`Delete ${selectedRowKeys.length} Selected Scans?`}
              description="This will permanently delete the selected scan records from the database."
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={async () => {
                await onDeleteBatch(selectedRowKeys.map(String));
                setSelectedRowKeys([]);
                message.success(`Deleted ${selectedRowKeys.length} records.`);
              }}
            >
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Delete Selected ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}

          {total > 0 && onClearAll && (
            <Popconfirm
              title="Delete Entire Diagnostic History?"
              description="Are you sure you want to delete ALL historical records? This cannot be undone."
              okText="Yes, Wipe All"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={async () => {
                await onClearAll();
                setSelectedRowKeys([]);
                message.success("Diagnostic history cleared.");
              }}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-rose-900/50 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40 hover:text-rose-100 gap-1"
              >
                <Trash2 className="h-3 w-3 text-rose-400" />
                Clear All History ({total})
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>

      {/* Ant Design Data Table */}
      <div className="overflow-x-auto">
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={data}
          rowKey={(r) => r.scan_id || String(r.id)}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (totalCount) => `Total ${totalCount} CT records`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span className="text-xs text-slate-400">No diagnostic history found.</span>}
              />
            ),
          }}
        />
      </div>
    </div>
  );
}
