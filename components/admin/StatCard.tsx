"use client";
import React from "react";

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ElementType; // Use ElementType for component references
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color: "violet" | "pink" | "blue" | "emerald" | "orange";
    isLoading?: boolean;
}

const colorStyles = {
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
    pink: "bg-pink-50 text-pink-600 ring-pink-100",
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    orange: "bg-orange-50 text-orange-600 ring-orange-100",
};

export default function StatCard({ title, value, icon: Icon, trend, color, isLoading }: StatCardProps) {
    return (
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-zinc-500">{title}</p>
                    <div className="mt-2 text-3xl font-bold text-zinc-900">
                        {isLoading ? (
                            <div className="h-9 w-24 bg-zinc-100 rounded-lg animate-pulse"></div>
                        ) : (
                            value
                        )}
                    </div>
                </div>
                <div className={`p-3 rounded-xl ring-1 ${colorStyles[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            {trend && !isLoading && (
                <div className="mt-4 flex items-center text-sm">
                    <span
                        className={`font-medium ${trend.isPositive ? "text-emerald-600" : "text-red-600"
                            }`}
                    >
                        {trend.isPositive ? "+" : ""}
                        {trend.value}%
                    </span>
                    <span className="ml-2 text-zinc-400">so với tháng trước</span>
                </div>
            )}
        </div>
    );
}
