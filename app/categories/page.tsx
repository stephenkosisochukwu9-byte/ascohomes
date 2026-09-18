"use client";


import Link from "next/link";


const categories = [
  {
    name: "Cleaning Supplies",
    description: "Keep your home clean.",
    image: "/categories/cleaning.jpg",
    href: "/categories/cleaning",
  },
  {
    name: "Bathroom",
    description: "Bathroom essentials.",
    image: "/categories/bathroom.jpg",
    href: "/categories/bathroom",
  },
  {
    name: "Kitchen",
    description: "Kitchen equipment and essentials.",
    image: "/categories/kitchen.jpg",
    href: "/categories/kitchen",
  },
  {
    name: "Appliances",
    description: "Useful home appliances.",
    image: "/categories/appliances.jpg",
    href: "/categories/appliances",
  },
  {
    name: "Home & Storage",
    description: "Organize and improve your home.",
    image: "/categories/home-storage.jpg",
    href: "/categories/home-storage",
  },
];


export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-white text-[#111827]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-8">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight sm:text-2xl"
          >
            <span className="text-blue-600">ASCO</span>
            <span className="text-orange-500">HOMES</span>
          </Link>


          <div className="flex items-center gap-4 text-xl sm:gap-5 sm:text-2xl">
            <Link
              href="/cart"
              aria-label="Shopping cart"
              className="text-[#111827]"
            >
              🛒
            </Link>


            <Link
              href="/profile"
              aria-label="Account"
              className="text-[#111827]"
            >
              👤
            </Link>
          </div>
        </div>
      </header>


      {/* Page */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
        {/* Heading */}
        <div className="mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-700 sm:text-sm">
            Explore ASCOHOMES
          </p>


          <h1 className="text-2xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
            Shop by Category
          </h1>


          <p className="mt-2 text-sm font-medium leading-6 text-[#374151] sm:text-lg">
            Find the household products you need, organized into simple
            categories.
          </p>
        </div>


        {/* Category Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition active:scale-[0.98] hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
            >
              {/* Category Image */}
              <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>


              {/* Category Information */}
              <div className="flex min-h-[150px] flex-col p-4 sm:min-h-[180px] sm:p-6">
                {/* Name */}
                <h2 className="text-base font-extrabold leading-tight text-[#111827] sm:text-xl">
                  {category.name}
                </h2>


                {/* Description */}
                <p className="mt-2 text-xs font-medium leading-5 text-[#374151] sm:text-base sm:leading-6">
                  {category.description}
                </p>


                {/* Link */}
                <div className="mt-auto pt-4 text-xs font-bold text-blue-700 sm:text-sm">
                  Shop category
                  <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

