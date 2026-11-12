import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo adjuntamos el JWT a peticiones de nuestra API.
  if (!req.url.startsWith('/api/') &&
    !req.url.startsWith('http://localhost:8080/api/')) {
    return next(req);
  }

  const token = localStorage.getItem('biblioteca_token')?.trim();

  if (!token) {
    return next(req);
  }

  const requestConToken = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(requestConToken);
};
