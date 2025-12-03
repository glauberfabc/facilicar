import { useState, useEffect, useRef } from 'react'
import { ChevronDown, X, Search } from 'lucide-react'

export function SearchableSelect({
    options = [],
    value,
    onChange,
    placeholder = "Selecione...",
    label = "",
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const wrapperRef = useRef(null)

    const selectedOption = options.find(opt => opt.value === value)

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
        onChange(optionValue)
        setIsOpen(false)
        setSearchTerm("")
    }

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && <label className="text-sm text-metallic-light block mb-1">{label}</label>}

            <div
                className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 text-white flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? "text-white" : "text-gray-400"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className="w-4 h-4 text-metallic-light" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-dark-light border border-dark-lighter rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-dark-lighter sticky top-0 bg-dark-light">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-metallic-light" />
                            <input
                                type="text"
                                className="w-full bg-dark-lighter rounded pl-8 pr-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {filteredOptions.length > 0 ? (
                            (() => {
                                const hasGroups = filteredOptions.some(opt => opt.group)
                                if (hasGroups) {
                                    const groups = filteredOptions.reduce((acc, opt) => {
                                        const group = opt.group || 'Outros'
                                        if (!acc[group]) acc[group] = []
                                        acc[group].push(opt)
                                        return acc
                                    }, {})

                                    return Object.entries(groups).map(([groupName, groupOptions]) => (
                                        <div key={groupName}>
                                            <div className="px-2 py-1 text-xs font-semibold text-metallic-light bg-dark-lighter/50 sticky top-0">
                                                {groupName}
                                            </div>
                                            {groupOptions.map(option => (
                                                <div
                                                    key={option.value}
                                                    className={`p-2 pl-4 text-sm cursor-pointer hover:bg-primary/20 text-white transition-colors ${value === option.value ? 'bg-primary/10 text-primary' : ''}`}
                                                    onClick={() => handleSelect(option.value)}
                                                >
                                                    {option.label}
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                }

                                return filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className={`p-2 text-sm cursor-pointer hover:bg-primary/20 text-white transition-colors ${value === option.value ? 'bg-primary/10 text-primary' : ''}`}
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        {option.label}
                                    </div>
                                ))
                            })()
                        ) : (
                            <div className="p-3 text-center text-sm text-metallic-light">
                                Nenhuma opção encontrada
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
