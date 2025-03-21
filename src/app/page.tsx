import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Swap anytime, anywhere.</h1>
      <Card className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-lg">Sell</p>
            <Select>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eth">ETH</SelectItem>
                <SelectItem value="btc">BTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="0" className="bg-gray-700 text-white" />
          <div className="flex justify-between items-center">
            <p className="text-lg">Buy</p>
            <Button variant="default" className="bg-pink-500">
              Select token
            </Button>
          </div>
          <Input placeholder="0" className="bg-gray-700 text-white" />
          <Button variant="contained" className="bg-purple-700 mt-4">
            Get started
          </Button>
        </div>
      </Card>
      <p className="mt-8 text-center">
        The largest onchain marketplace. Buy and sell crypto on Ethereum and 11+
        other chains.
      </p>
      <p className="mt-4 text-center">Scroll to learn more</p>
    </div>
  );
}
