import React, { useState, useEffect } from 'react';

export const FormattedNumberInput = ({ value, onChange, className = '', ...props }) => {
  const formatDisplay = (num) => num ? Number(num).toLocaleString('id-ID') : '';
  const [display, setDisplay] = useState(formatDisplay(value));

  useEffect(() => { setDisplay(formatDisplay(value)); }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = Number(raw) || 0;
    setDisplay(num.toLocaleString('id-ID'));
    if (onChange) onChange(num);
  };

  return (
    <div className="formatted-input-wrapper">
      <span className="formatted-input-prefix">Rp</span>
      <input type="text" inputMode="numeric" value={display} onChange={handleChange} className={`form-input formatted-input-field ${className}`} {...props} />
    </div>
  );
};
