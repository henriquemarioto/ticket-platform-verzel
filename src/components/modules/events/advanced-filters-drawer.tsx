'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export function AdvancedFiltersDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Local state for filters
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [startDate, setStartDate] = useState(
    searchParams.get('startDate') || '',
  );
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [location, setLocation] = useState(searchParams.get('city') || '');

  useEffect(() => setMounted(true), []);

  // Sync state when drawer opens or URL changes
  useEffect(() => {
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setStartDate(searchParams.get('startDate') || '');
    setEndDate(searchParams.get('endDate') || '');
    setLocation(searchParams.get('city') || '');
  }, [searchParams, isOpen]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');

    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');

    if (startDate) params.set('startDate', startDate);
    else params.delete('startDate');

    if (endDate) params.set('endDate', endDate);
    else params.delete('endDate');

    if (location) params.set('city', location);
    else params.delete('city');

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setStartDate('');
    setEndDate('');
    setLocation('');

    const params = new URLSearchParams(searchParams.toString());
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('startDate');
    params.delete('endDate');
    params.delete('city');

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const hasActiveFilters = Boolean(
    searchParams.get('minPrice') ||
    searchParams.get('maxPrice') ||
    searchParams.get('startDate') ||
    searchParams.get('endDate') ||
    searchParams.get('city'),
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={cn(
          'gap-2',
          hasActiveFilters && 'border-primary text-primary bg-primary/5',
        )}
      >
        <Filter className="h-4 w-4" />
        Filtros
        {hasActiveFilters && (
          <span className="bg-primary flex h-2 w-2 rounded-full" />
        )}
      </Button>

      {mounted &&
        createPortal(
          <>
            {/* Backdrop */}
            {isOpen && (
              <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
              />
            )}

            {/* Drawer */}
            <div
              className={cn(
                'bg-bg-surface fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col shadow-xl transition-transform duration-300 ease-in-out',
                isOpen ? 'translate-x-0' : 'translate-x-full',
              )}
            >
              <div className="border-border-subtle flex items-center justify-between border-b p-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Filter className="h-5 w-5" />
                  Filtros
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-4">
                {/* Preço */}
                <div className="space-y-3">
                  <h3 className="text-text-primary text-sm font-medium">
                    Faixa de Preço
                  </h3>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min (R$)"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <span className="text-text-muted">-</span>
                    <Input
                      type="number"
                      placeholder="Max (R$)"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Data */}
                <div className="space-y-3">
                  <h3 className="text-text-primary text-sm font-medium">
                    Período
                  </h3>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Localização */}
                <div className="space-y-3">
                  <h3 className="text-text-primary text-sm font-medium">
                    Localização (Cidade)
                  </h3>
                  <Input
                    placeholder="Cidade ou local"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-border-subtle bg-bg-main flex gap-2 border-t p-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearFilters}
                >
                  Limpar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={applyFilters}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
