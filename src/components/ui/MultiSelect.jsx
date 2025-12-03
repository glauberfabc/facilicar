import { useState, useEffect, useRef } from 'react'
import { ChevronDown, X, Check } from 'lucide-react'

export function MultiSelect({
    options = [],
    value = [],
    onChange,
    placeholder = "Selecione...",
    label = "",
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [wrapperRef])

    const handleSelect = (optionValue) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue]
        onChange(newValue)
    }

    const removeTag = (e, optionValue) => {
        e.stopPropagation()
        onChange(value.filter(v => v !== optionValue))
    }

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && <label className="text-sm text-metallic-light block mb-1">{label}</label>}

            <div
                className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 text-white min-h-[42px] cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-between"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1">
                    {value.length > 0 ? (
                        value.map(val => {
                            const option = options.find(o => o.value === val)
                            return (
                                <span key={val} className="bg-primary/20 text-primary text-xs px-2 py-1 rounded flex items-center gap-1">
                                    {option ? option.label : val}
                                    <X
                                        className="w-3 h-3 hover:text-white cursor-pointer"
                                        onClick={(e) => removeTag(e, val)}
                                    />
                                </span>
                            )
                        })
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <ChevronDown className="w-4 h-4 text-metallic-light ml-2 shrink-0" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-dark-light border border-dark-lighter rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {options.map((option) => {
                        const isSelected = value.includes(option.value)
                        return (
                            <div
                                key={option.value}
                                className={`p-2 text-sm cursor-pointer hover:bg-primary/20 text-white transition-colors flex items-center justify-between ${isSelected ? 'bg-primary/10' : ''}`}
                                onClick={() => handleSelect(option.value)}
                            >
                                <span>{option.label}</span>
                                {isSelected && <Check className="w-4 h-4 text-primary" />}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
