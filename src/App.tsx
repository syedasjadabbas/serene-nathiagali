import { lazy, Suspense, useEffect } from 'react'
import { usePath } from './lib/router'
import { Layout } from './components/Layout'
import Home from './home/Home'

// Inner pages load on demand, so the homepage ships without them.
const loaders = {
  about: () => import('./pages/About'),
  amenities: () => import('./pages/Amenities'),
  floorPlans: () => import('./pages/FloorPlans'),
  paymentPlan: () => import('./pages/PaymentPlan'),
  spu: () => import('./pages/SmartPropertyUnit'),
  progress: () => import('./pages/Progress'),
  gallery: () => import('./pages/Gallery'),
  contact: () => import('./pages/Contact'),
}
const About = lazy(loaders.about)
const Amenities = lazy(loaders.amenities)
const FloorPlans = lazy(loaders.floorPlans)
const PaymentPlan = lazy(loaders.paymentPlan)
const SmartPropertyUnit = lazy(loaders.spu)
const Progress = lazy(loaders.progress)
const Gallery = lazy(loaders.gallery)
const Contact = lazy(loaders.contact)

const ROUTES: Record<string, React.ComponentType> = {
  '/': Home,
  '/about': About,
  '/amenities': Amenities,
  '/floor-plans': FloorPlans,
  '/payment-plan': PaymentPlan,
  '/smart-property-unit': SmartPropertyUnit,
  '/progress': Progress,
  '/gallery': Gallery,
  '/contact': Contact,
}

export default function App() {
  const path = usePath()
  const Page = ROUTES[path] ?? Home
  // after the first page, inner pages are prefetched in the background
  useEffect(() => {
    const t = setTimeout(() => Object.values(loaders).forEach((load) => void load()), 4000)
    return () => clearTimeout(t)
  }, [])
  return (
    <Layout>
      <Suspense fallback={null}>
        <Page key={path} />
      </Suspense>
    </Layout>
  )
}
