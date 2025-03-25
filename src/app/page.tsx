"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
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
  const [sellValue, setSellValue] = useState("");
  const [selectedToken, setSelectedToken] = useState("eth");
  const [coinAmount, setCoinAmount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0.00051); // Initial mock exchange rate
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSellInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/^\$+/, ""); // Remove any leading $
    setSellValue(`$${value}`); // Add $ back to the start
    const numericValue = parseFloat(value) || 0;
    setCoinAmount(numericValue * exchangeRate);
  };

  const handleTokenChange = (value: string) => {
    setSelectedToken(value);
    // Recalculate the exchange rate randomly whenever the token changes
    const newExchangeRate = Math.random() * 0.001; // Random exchange rate for demonstration
    setExchangeRate(newExchangeRate);
    // Recalculate coin amount with the new exchange rate
    const numericValue = parseFloat(sellValue.replace(/^\$+/, "")) || 0;
    setCoinAmount(numericValue * newExchangeRate);
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (cardRef.current) {
        console.log('testing again')
        const { clientX, clientY } = event;
        const { innerWidth, innerHeight } = window;
        let xRotation = (clientY / innerHeight - 0.5) * 20; // Slower rotation factor
        let yRotation = (clientX / innerWidth - 0.5) * 20; // Slower rotation factor

        // Clamp the rotation to at most 5 degrees in every axis
        xRotation = Math.max(-5, Math.min(5, xRotation));
        yRotation = Math.max(-5, Math.min(5, yRotation));

        cardRef.current.style.transition = "transform 0.2s ease-out"; // Smooth transition
        cardRef.current.style.transform = `perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg)`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-8">
      <header className="absolute top-0 left-0 p-4 flex space-x-4">
        <h2 className="text-xl font-semibold text-white">ZeroFlow</h2>
        <div className="flex justify-center w-full">
          <Button variant="default" className="text-white mr-2">
            Trade
          </Button>
          <Button variant="default" className="text-white">
            Pool
          </Button>
        </div>
      </header>
      <Button
        variant="default"
        className="absolute top-0 right-0 m-4 text-white"
      >
        Connect Wallet
      </Button>
      <h1 className="text-4xl mt-[200px] font-bold mb-8 text-white">
        Swap with no fees.
      </h1>
      <Card
        ref={cardRef}
        className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg"
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-lg text-white">Sell</p>
            <Select onValueChange={handleTokenChange}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eth">ETH</SelectItem>
                <SelectItem value="btc">BTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            value={sellValue}
            onChange={handleSellInputChange}
            placeholder="$0"
            className="bg-gray-700 text-white"
          />
          {sellValue && (
            <p className="text-sm text-white">
              {coinAmount.toFixed(5)} {selectedToken.toUpperCase()}
            </p>
          )}
          <div className="flex justify-between items-center">
            <p className="text-lg text-white">Buy</p>
            <Button variant="default" className="bg-pink-500">
              Select Token
            </Button>
          </div>
          <Input placeholder="0" className="bg-gray-700 text-white" />
          <Button variant="default" className="bg-purple-700 mt-4">
            Get started
          </Button>
        </div>
      </Card>
      <p className="mt-8 text-center text-white">
        The first zero-gas DEX with no bridging. Buy and sell crypto on Ethereum
        and many other chains.
      </p>
      <p className="mt-4 text-center text-gray-400">Scroll to learn more</p>

      <div className="mt-[200px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
        <Card className="p-6 bg-gray-800 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-white">
            Keep the security of your chain.
          </h3>
          <p className="text-white">
            Using the wire protocol, your tokens stay on their native chain,
            retaining all security features.
          </p>
        </Card>
        <Card className="p-6 bg-gray-800 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-white">No Fees.</h3>
          <p className="text-white">
            Offered exclusively on ZeroFlow, there are no required fees for
            trading. This includes GAS fees.
          </p>
        </Card>
        <Card className="p-6 bg-gray-800 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-white">Cross-stake.</h3>
          <p className="text-white">
            Stake any token, receive rewards in any token.
          </p>
        </Card>
      </div>
    </div>
  );
}
