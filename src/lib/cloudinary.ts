/**
 * Cloudinary client-side signed upload utility.
 *
 * Uses uploadSignature as a CALLBACK so the widget passes us the exact
 * parameters it wants signed (including dynamic ones like `source=uw`).
 * We forward those to our server, which signs them with the API secret.
 * The API secret NEVER reaches the browser.
 */
export async function openCloudinaryWidget(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Cloudinary widget can only be opened in the browser.');
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

  if (!cloudName || !apiKey) {
    throw new Error('Cloudinary environment variables (cloud name / api key) are not set.');
  }

  return new Promise((resolve, reject) => {
    // @ts-ignore – Cloudinary widget is loaded via CDN <Script> tag
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        apiKey,
        // uploadSignature as a function: widget calls this with the exact
        // params it intends to sign, then we return the server signature.
        uploadSignature: async (
          callback: (sig: string) => void,
          paramsToSign: Record<string, string>
        ) => {
          try {
            const res = await fetch('/api/cloudinary/sign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(paramsToSign),
            });

            if (!res.ok) throw new Error('Failed to get upload signature.');
            const { signature } = await res.json();
            callback(signature);
          } catch (err) {
            reject(err);
          }
        },
        folder: 'news-management',
        multiple: false,
        resourceType: 'image',
        cropping: false,
        showPoweredBy: false,
        sources: ['local', 'url', 'camera'],
        styles: {
          palette: {
            window:          '#1e293b',
            windowBorder:    '#334155',
            tabIcon:         '#6366f1',
            menuIcons:       '#94a3b8',
            textDark:        '#1e293b',
            textLight:       '#f8fafc',
            link:            '#6366f1',
            action:          '#6366f1',
            inactiveTabIcon: '#64748b',
            error:           '#ef4444',
            inProgress:      '#6366f1',
            complete:        '#22c55e',
            sourceBg:        '#0f172a',
          },
        },
        // Auto-transform to 1200×630 for blog cover images
        transformation: [
          { width: 1200, height: 630, crop: 'fill', quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error: any, result: any) => {
        if (error) {
          reject(new Error(error.statusText ?? 'Upload failed.'));
          return;
        }
        if (result.event === 'success') {
          resolve(result.info.secure_url as string);
        }
      }
    );

    widget.open();
  });
}
