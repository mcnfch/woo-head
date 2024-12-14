export default function Head() {
  return (
    <>
      <title>Festival Rave Gear</title>
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="description" content="Festival and rave clothing and accessories" />
      <link rel="icon" href="/favicon.ico" />
      
      {/* Preload critical resources */}
      <link
        rel="preload"
        href="/images/frgheader.png"
        as="image"
        type="image/png"
      />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Defer non-critical CSS */}
      <link 
        rel="stylesheet" 
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        media="print"
        onLoad="this.media='all'"
      />
    </>
  )
}
