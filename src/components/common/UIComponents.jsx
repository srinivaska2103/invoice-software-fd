'use client';

import React from 'react';
import { ChevronDown, Check, Search, AlertTriangle, Info, X, Inbox, Eye, EyeOff } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 focus:ring-indigo-500 active:scale-[0.98]',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400 border border-slate-200/80 active:scale-[0.98]',
    outline:
      'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300 focus:ring-indigo-500 shadow-2xs active:scale-[0.98]',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md shadow-rose-500/20 focus:ring-rose-500 active:scale-[0.98]',
    white:
      'bg-white hover:bg-indigo-50 text-indigo-700 font-bold shadow-md focus:ring-white active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-slate-100/80 text-slate-600 focus:ring-slate-300 shadow-none',
  };

  const selectedVariantStyle = variants[variant] || variants.primary;

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2.5',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${selectedVariantStyle} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
};

export const Input = React.forwardRef(
  ({ label, error, helperText, icon: Icon, type, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-xl">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            type={computedType}
            className={`w-full bg-white/90 border ${
              error
                ? 'border-rose-400 focus:ring-rose-500/20'
                : 'border-slate-200/90 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
            } rounded-xl text-sm ${Icon ? 'pl-10' : 'pl-3.5'} ${
              isPassword ? 'pr-10' : 'pr-3.5'
            } py-2.5 text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none shadow-2xs ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex="-1"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 stroke-[2]" />
              ) : (
                <Eye className="w-4 h-4 stroke-[2]" />
              )}
            </button>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export const Select = React.forwardRef(
  (
    {
      label,
      error,
      options = [],
      children,
      value,
      onChange,
      placeholder = 'Select option...',
      className = '',
      disabled = false,
      name,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const containerRef = React.useRef(null);

    // Extract options array from children if options prop is not passed directly
    const parsedOptions = React.useMemo(() => {
      if (options && options.length > 0) {
        return options.map((opt) =>
          typeof opt === 'object' ? opt : { value: opt, label: String(opt) }
        );
      }
      if (children) {
        return React.Children.toArray(children)
          .map((child) => {
            if (React.isValidElement(child)) {
              return {
                value: child.props.value !== undefined ? child.props.value : child.props.children,
                label: child.props.children,
                disabled: child.props.disabled,
              };
            }
            return null;
          })
          .filter(Boolean);
      }
      return [];
    }, [options, children]);

    // Close dropdown on outside click or ESC key
    React.useEffect(() => {
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && isOpen) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen]);

    // Filter options if searchQuery is typed
    const filteredOptions = React.useMemo(() => {
      if (!searchQuery.trim()) return parsedOptions;
      return parsedOptions.filter((opt) =>
        String(opt.label || opt.value)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }, [parsedOptions, searchQuery]);

    const selectedOption = parsedOptions.find(
      (opt) => String(opt.value) === String(value)
    );

    const handleSelect = (optValue, optDisabled) => {
      if (optDisabled || disabled) return;
      setIsOpen(false);
      setSearchQuery('');
      if (onChange) {
        const syntheticEvent = {
          target: {
            name: name || id,
            value: optValue,
          },
        };
        onChange(syntheticEvent);
      }
    };

    return (
      <div className={`w-full relative ${isOpen ? 'z-50' : 'z-10'}`} ref={containerRef}>
        {label && (
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}

        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full bg-white/95 border ${
            error
              ? 'border-rose-400 focus:ring-rose-500/20'
              : isOpen
              ? 'border-indigo-500 ring-4 ring-indigo-500/10'
              : 'border-slate-200/90 hover:border-indigo-300'
          } rounded-xl text-sm px-3.5 py-2.5 text-left text-slate-800 transition-all duration-200 focus:outline-none shadow-2xs flex items-center justify-between gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
          <span
            className={`truncate font-medium ${
              selectedOption && selectedOption.value !== ''
                ? 'text-slate-800 font-semibold'
                : 'text-slate-400'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-indigo-500 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>

        {/* Custom Glassmorphic Popover List */}
        {isOpen && (
          <div className="absolute left-0 right-0 mt-1.5 z-[9999] bg-white border border-slate-200/90 rounded-2xl shadow-2xl shadow-indigo-950/20 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
            {parsedOptions.length > 6 && (
              <div className="p-1 pb-1.5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-10">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search options..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs pl-8 pr-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelect(opt.value, opt.disabled)}
                    className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition flex items-center justify-between cursor-pointer ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-600'
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                No matching options
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export const Card = ({ children, className = '', title, action, icon: Icon }) => {
  return (
    <div className={`bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 p-4 sm:p-6 ${className}`}>
      {title && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight truncate">{title}</h3>
          </div>
          {action && <div className="self-end sm:self-auto shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export const Badge = ({ children, variant = 'slate', className = '' }) => {
  const variants = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 ring-1 ring-indigo-500/10',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-1 ring-emerald-500/10',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80 ring-1 ring-amber-500/10',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80 ring-1 ring-rose-500/10',
    slate: 'bg-slate-100 text-slate-700 border-slate-200/80',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80 ring-1 ring-blue-500/10',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[variant] || variants.slate} ${className}`}
    >
      {children}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4 text-center">
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-md transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        <div
          className={`relative w-[calc(100%-0.75rem)] ${maxWidth} transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white p-3 sm:p-6 text-left align-middle shadow-2xl shadow-indigo-950/20 transition-all border border-slate-100 max-h-[92vh] flex flex-col my-auto`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 sm:mb-4 shrink-0">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate pr-2">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto flex-1 pr-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const Skeleton = ({ className = '' }) => {
  return <div className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`}></div>;
};

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Data Available',
  message = 'There are no records matching your current request or filter criteria.',
  action = null,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-10 px-4 text-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-200 ${className}`}>
      <div className="relative mb-3.5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-100 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-xs relative z-10">
          <Icon className="w-7 h-7 opacity-90 stroke-[1.75]" />
        </div>
        <div className="absolute inset-0 rounded-2xl bg-indigo-400/20 blur-lg -z-0" />
      </div>
      <h4 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight mb-1">
        {title}
      </h4>
      <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mb-3">
        {message}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export const Table = ({ headers, children, isLoading, isEmpty, emptyTitle, emptyMessage }) => {
  return (
    <div className="w-full overflow-x-auto min-w-0 max-w-full rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-2xs">
      <table className="w-full text-left text-sm text-slate-600 min-w-[550px] sm:min-w-0">
        <thead className="bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
          <tr>
            {headers.map((head, idx) => (
              <th key={idx} className="px-3.5 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx}>
                {headers.map((_, cIdx) => (
                  <td key={cIdx} className="px-3.5 sm:px-4 py-3.5">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : isEmpty ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-6">
                <EmptyState
                  title={emptyTitle || 'No Records Found'}
                  message={emptyMessage || 'There are no records matching your current filter criteria.'}
                />
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
};

export const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-slate-500 font-medium">
        Page <span className="font-bold text-slate-800">{currentPage}</span> of{' '}
        <span className="font-bold text-slate-800">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl transition-opacity animate-in fade-in duration-200"
          onClick={() => !isLoading && onClose()}
          aria-hidden="true"
        />

        {/* Modal Card */}
        <div className="relative w-[calc(100%-1.5rem)] max-w-md transform overflow-hidden rounded-3xl bg-white/95 backdrop-blur-2xl p-5 sm:p-6 text-left align-middle shadow-2xl shadow-indigo-950/30 transition-all border border-slate-200/90 animate-in fade-in zoom-in-95 duration-200 my-auto space-y-5">
          {/* Close button */}
          <button
            onClick={() => !isLoading && onClose()}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4 pt-1">
            {/* Animated Glow Badge Icon */}
            <div className="relative shrink-0">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:scale-105 ${
                  variant === 'danger'
                    ? 'bg-rose-500/10 text-rose-600 border border-rose-200/80 shadow-md shadow-rose-500/10'
                    : 'bg-indigo-500/10 text-indigo-600 border border-indigo-200/80 shadow-md shadow-indigo-500/10'
                }`}
              >
                {variant === 'danger' ? (
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                ) : (
                  <Info className="w-6 h-6 animate-pulse" />
                )}
              </div>
              <div
                className={`absolute inset-0 rounded-2xl blur-md opacity-50 ${
                  variant === 'danger' ? 'bg-rose-400/40' : 'bg-indigo-400/40'
                }`}
              />
            </div>

            <div className="space-y-1.5 flex-1 min-w-0 pr-6">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3.5 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold hover:bg-slate-100 text-slate-700 transition active:scale-95"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={variant}
              size="sm"
              isLoading={isLoading}
              onClick={onConfirm}
              className="px-5 py-2.5 text-xs font-extrabold shadow-md hover:shadow-lg transition active:scale-95"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
