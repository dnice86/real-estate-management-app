"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, DollarSign, TrendingUp, TrendingDown, Home, Users, CreditCard, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, addMonths, parseISO, isSameMonth } from "date-fns"
import { useMemo, useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Transaction {
  id: string;
  amount: number;
  payer: string;
  description: string;
  date: string;
  booking_category: string;
  partner: string;
}

interface BookingCategory {
  id: string;
  Name: string;
  "Business - Main Category": string;
  "Business - Sub Category": string;
}

interface Partner {
  id: string;
  name_1: string;
  name_2: string;
  full_name: string;
  status: string;
}

interface MonthlySummaryProps {
  transactions: Transaction[];
  bookingCategories: BookingCategory[];
  partners: Partner[];
}

export function MonthlySummary({ transactions = [], bookingCategories = [], partners = [] }: MonthlySummaryProps) {
  // State for selected month
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const currentMonth = selectedMonth;
  const lastMonth = subMonths(currentMonth, 1);
  
  // Early return if no transactions
  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No Transaction Data</h3>
          <p className="text-muted-foreground">No transactions available for monthly summary analysis.</p>
        </div>
      </div>
    );
  }
  
  // Calculate monthly metrics
  const monthlyData = useMemo(() => {
    // Filter out transactions with invalid dates
    const validTransactions = transactions.filter(t => t.date && t.date.trim() !== '');
    
    const currentMonthTransactions = validTransactions.filter(t => {
      try {
        return isSameMonth(parseISO(t.date), currentMonth);
      } catch {
        return false;
      }
    });
    
    const lastMonthTransactions = validTransactions.filter(t => {
      try {
        return isSameMonth(parseISO(t.date), lastMonth);
      } catch {
        return false;
      }
    });
    
    // Calculate totals
    const currentMonthTotal = currentMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    const lastMonthTotal = lastMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    // Calculate rent income (Miete category)
    const currentMonthRent = currentMonthTransactions
      .filter(t => t.booking_category && t.booking_category === "Miete")
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    const lastMonthRent = lastMonthTransactions
      .filter(t => t.booking_category && t.booking_category === "Miete")
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    // Calculate expenses (negative amounts or expense categories)
    const currentMonthExpenses = currentMonthTransactions
      .filter(t => (t.amount && t.amount < 0) || (t.booking_category && !t.booking_category.includes("Miete")))
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    // Category breakdown for current month
    const categoryBreakdown = currentMonthTransactions.reduce((acc, t) => {
      const category = t.booking_category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = { count: 0, amount: 0 };
      }
      acc[category].count++;
      acc[category].amount += Math.abs(t.amount || 0);
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);
    
    // Partner activity for current month
    const partnerActivity = currentMonthTransactions.reduce((acc, t) => {
      const partner = t.partner || "Unknown";
      if (!acc[partner]) {
        acc[partner] = { count: 0, amount: 0 };
      }
      acc[partner].count++;
      acc[partner].amount += Math.abs(t.amount || 0);
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);
    
    // Calculate growth percentages
    const totalGrowth = lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    const rentGrowth = lastMonthRent > 0 ? ((currentMonthRent - lastMonthRent) / lastMonthRent) * 100 : 0;
    
    return {
      currentMonth: {
        total: currentMonthTotal,
        rent: currentMonthRent,
        expenses: currentMonthExpenses,
        transactionCount: currentMonthTransactions.length,
        netIncome: currentMonthRent - currentMonthExpenses
      },
      lastMonth: {
        total: lastMonthTotal,
        rent: lastMonthRent,
        transactionCount: lastMonthTransactions.length
      },
      growth: {
        total: totalGrowth,
        rent: rentGrowth
      },
      categoryBreakdown: Object.entries(categoryBreakdown)
        .sort(([,a], [,b]) => b.amount - a.amount)
        .slice(0, 5),
      partnerActivity: Object.entries(partnerActivity)
        .sort(([,a], [,b]) => b.amount - a.amount)
        .slice(0, 5)
    };
  }, [transactions, currentMonth, lastMonth, selectedMonth]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  // Generate list of available months from transaction data
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      if (t.date && t.date.trim() !== '') {
        try {
          const date = parseISO(t.date);
          const monthKey = format(date, 'yyyy-MM');
          months.add(monthKey);
        } catch {
          // Ignore invalid dates
        }
      }
    });
    
    return Array.from(months)
      .sort((a, b) => b.localeCompare(a)) // Sort descending (newest first)
      .slice(0, 24); // Last 24 months
  }, [transactions]);

  // Navigation functions
  const goToPreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  const selectMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
  };

  // Check if we can navigate
  const canGoNext = format(addMonths(selectedMonth, 1), 'yyyy-MM') <= format(new Date(), 'yyyy-MM');
  const isCurrentMonth = format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if the user is not typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (event.key === 'ArrowLeft' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        goToPreviousMonth();
      } else if (event.key === 'ArrowRight' && (event.ctrlKey || event.metaKey) && canGoNext) {
        event.preventDefault();
        goToNextMonth();
      } else if (event.key === 'Home' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        goToCurrentMonth();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext]);

  return (
    <div className="space-y-6">
      {/* Month Navigation Controls */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            {format(currentMonth, 'MMMM yyyy')} overview and performance metrics
          </p>
        </div>
        
        {/* Month Navigation Controls */}
        <div className="flex items-center gap-2">
          {/* Month Selector */}
          <Select
            value={format(selectedMonth, 'yyyy-MM')}
            onValueChange={selectMonth}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((monthKey) => {
                const date = new Date(monthKey + '-01');
                return (
                  <SelectItem key={monthKey} value={monthKey}>
                    {format(date, 'MMM yyyy')}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {/* Navigation Buttons */}
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPreviousMonth}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous month</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Previous month (Ctrl+←)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNextMonth}
                    disabled={!canGoNext}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next month</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Next month (Ctrl+→)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          
          {/* Current Month Button */}
          {!isCurrentMonth && (
            <Button
              variant="default"
              size="sm"
              onClick={goToCurrentMonth}
              className="ml-2"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Current
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyData.currentMonth.total)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {monthlyData.growth.total >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
              )}
              {formatPercent(monthlyData.growth.total)} from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rent Income</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyData.currentMonth.rent)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {monthlyData.growth.rent >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
              )}
              {formatPercent(monthlyData.growth.rent)} from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyData.currentMonth.netIncome)}</div>
            <p className="text-xs text-muted-foreground">
              After expenses: {formatCurrency(monthlyData.currentMonth.expenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyData.currentMonth.transactionCount}</div>
            <p className="text-xs text-muted-foreground">
              vs {monthlyData.lastMonth.transactionCount} last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Top Categories This Month
            </CardTitle>
            <CardDescription>
              Breakdown by booking category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyData.categoryBreakdown.map(([category, data]) => {
              const percentage = monthlyData.currentMonth.total > 0 ? (data.amount / monthlyData.currentMonth.total) * 100 : 0;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(data.amount)} ({data.count} transactions)
                    </span>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {percentage.toFixed(1)}% of total
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Partners This Month
            </CardTitle>
            <CardDescription>
              Most active business partners
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyData.partnerActivity.map(([partner, data]) => {
              const percentage = monthlyData.currentMonth.total > 0 ? (data.amount / monthlyData.currentMonth.total) * 100 : 0;
              return (
                <div key={partner} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{partner}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(data.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{data.count} transactions</span>
                    <span>{percentage.toFixed(1)}% of total</span>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className="h-1" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Month Comparison */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Month-over-Month Comparison</CardTitle>
              <CardDescription>
                {format(currentMonth, 'MMMM yyyy')} vs {format(lastMonth, 'MMMM yyyy')}
              </CardDescription>
            </div>
            {!isCurrentMonth && (
              <Badge variant="secondary" className="text-xs">
                Historical Data
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">Total Revenue</div>
              <div className="text-2xl font-bold">{formatCurrency(monthlyData.currentMonth.total)}</div>
              <div className="text-sm text-muted-foreground">
                Previous: {formatCurrency(monthlyData.lastMonth.total)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Rent Income</div>
              <div className="text-2xl font-bold">{formatCurrency(monthlyData.currentMonth.rent)}</div>
              <div className="text-sm text-muted-foreground">
                Previous: {formatCurrency(monthlyData.lastMonth.rent)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Transaction Volume</div>
              <div className="text-2xl font-bold">{monthlyData.currentMonth.transactionCount}</div>
              <div className="text-sm text-muted-foreground">
                Previous: {monthlyData.lastMonth.transactionCount}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">Performance Highlights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {monthlyData.growth.total > 0 && (
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    Total income increased by {formatPercent(monthlyData.growth.total)}
                  </li>
                )}
                {monthlyData.growth.rent > 0 && (
                  <li className="flex items-center gap-2">
                    <Home className="w-3 h-3 text-green-500" />
                    Rent income grew by {formatPercent(monthlyData.growth.rent)}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <CreditCard className="w-3 h-3 text-blue-500" />
                  Processed {monthlyData.currentMonth.transactionCount} transactions this month
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Key Metrics</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Average transaction: {formatCurrency(monthlyData.currentMonth.transactionCount > 0 ? monthlyData.currentMonth.total / monthlyData.currentMonth.transactionCount : 0)}</li>
                <li>Largest category: {monthlyData.categoryBreakdown[0]?.[0] || "N/A"}</li>
                <li>Most active partner: {monthlyData.partnerActivity[0]?.[0] || "N/A"}</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Navigation</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+←</kbd> Previous month</li>
                <li><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+→</kbd> Next month</li>
                <li><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Home</kbd> Current month</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
