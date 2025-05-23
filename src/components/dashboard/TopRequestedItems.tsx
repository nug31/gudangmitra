import React from "react";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { TrendingUp, Package } from "lucide-react";

interface TopRequestedItem {
  name: string;
  totalRequested: number;
}

interface TopRequestedItemsProps {
  items: TopRequestedItem[];
  isLoading: boolean;
}

const TopRequestedItems: React.FC<TopRequestedItemsProps> = ({ items, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Top Requested Items</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Top Requested Items</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No request data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxRequested = Math.max(...items.map(item => item.totalRequested));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Top Requested Items</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">Most popular items by request volume</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => {
            const percentage = (item.totalRequested / maxRequested) * 100;
            const colors = [
              "bg-blue-500",
              "bg-green-500", 
              "bg-yellow-500",
              "bg-purple-500",
              "bg-red-500"
            ];
            
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-full ${colors[index]} flex items-center justify-center text-white text-sm font-bold mr-3`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </span>
                      <span className="text-sm font-bold text-gray-700 ml-2">
                        {item.totalRequested}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${colors[index]} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopRequestedItems;
