import { PoolsTable } from '@/components/PoolsTable'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IoIosAdd } from 'react-icons/io'
import { FaSwimmingPool } from 'react-icons/fa'

export default function Pool() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white pt-16 md:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          <div className="w-full lg:w-auto">
            <h1 className="text-2xl md:text-3xl font-semibold mb-6">Your Pools</h1>
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
            <div className="border border-gray-600 flex items-center rounded-lg p-4 gap-4 w-full max-w-2xl">
              <div className="bg-violet-800 rounded-xl p-2 flex-shrink-0">
                <FaSwimmingPool className="text-violet-400 text-2xl sm:text-3xl" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-white font-bold text-base sm:text-lg md:text-xl mb-1">Welcome to your positions</h2>
                <p className="text-white text-sm sm:text-base">Connect your wallet to view your current positions.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 sm:mt-12">
          <h2 className="text-xl md:text-2xl mb-6 font-medium">Principal pools according to TVL</h2>
          <div className="overflow-x-auto items-center justify-center flex">
            <PoolsTable />
          </div>
        </div>
      </div>
    </div>
  )
}
