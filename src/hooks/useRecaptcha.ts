import { useState, useRef, useCallback, useEffect } from 'react';

// third party
import ReCAPTCHA from 'react-google-recaptcha';

// ==============================|| HOOKS - RECAPTCHA ||============================== //

const useRecaptcha = () => {
  const [capchaToken, setCapchaToken] = useState<string>('');
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);

  const handleRecaptcha = useCallback((token: string | null) => {
    setCapchaToken(token || '');
  }, []);

  useEffect(() => {
    const refreshCaptcha = () => {
      if (recaptchaRef.current && capchaToken) {
        recaptchaRef.current.reset();
        setCapchaToken('');
      }
    };

    let tokenRefreshTimeout: NodeJS.Timeout | null = null;

    if (capchaToken) {
      tokenRefreshTimeout = setTimeout(refreshCaptcha, 110000); // 110 seconds
    }

    return () => {
      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout);
      }
    };
  }, [capchaToken]);

  return { capchaToken, setCapchaToken, recaptchaRef, handleRecaptcha };
};

export default useRecaptcha;
