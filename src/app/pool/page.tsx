import { PoolsTable } from '@/components/PoolsTable'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IoIosAdd } from 'react-icons/io'
import { FaSwimmingPool } from 'react-icons/fa'

export default function Pool() {
  return (
    <div className="flex justify-center min-h-screen bg-gradient-to-b from-black to-gray-900 text-white pt-[80px]">
      <div className="flex flex-col items-start">
        <div className="flex flex-col items-start justify-start px-4">
          <h1 className="text-2xl font-semibold mb-6 text-white">Your Pools</h1>
          <div className="flex flex-grow mb-6">
            <Button className="rounded-l-xl rounded-r-none border-r-0 gap-2 dark:bg-white dark:hover:bg-gray-200 focus:ring-0 cursor-pointer">
              <IoIosAdd className="text-xl" />
              New
            </Button>
            <Select>
              <SelectTrigger
                className="rounded-r-xl rounded-l-none border-l-gray-400 text-black cursor-pointer 
                dark:bg-white 
                dark:hover:bg-gray-200 focus:ring-0"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">New pool v4</SelectItem>
                <SelectItem value="sell">New pool v3</SelectItem>
                <SelectItem value="swap">New pool v2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="border border-gray-600 flex items-center rounded-lg p-4 gap-4 mb-4">
            <div className="bg-violet-800 rounded-xl px-2 py-3 h-[50px]">
              <FaSwimmingPool className="text-violet-400 text-3xl" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-white font-bold text-lg mb-1">Welcome to your positions</h2>
              <p className="text-white">Connect your wallet to view your current positions.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start justify-start px-4">
          <h2 className="mb-4">Principal pools according to TVL</h2>
          <PoolsTable />
        </div>
      </div>
    </div>
  )
}
