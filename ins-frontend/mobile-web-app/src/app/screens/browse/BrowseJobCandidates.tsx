import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Search, MapPin, Filter, Briefcase, DollarSign, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { jobsService, categoriesService, Job, Category } from '@/services';

export default function BrowseJobCandidates() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    categoriesService.getCategoriesByModule('jobs').then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    jobsService
      .browseJobs({ category: selectedCategory || undefined })
      .then((data) => {
        setJobs(data);
        setFilteredJobs(data);
      })
      .catch(() => setError('Failed to load jobs.'))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredJobs(jobs);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredJobs(
        jobs.filter(
          (j) =>
            j.title.toLowerCase().includes(q) ||
            j.companyName?.toLowerCase().includes(q) ||
            j.skills?.some((s) => s.toLowerCase().includes(q)),
        ),
      );
    }
  }, [searchQuery, jobs]);

  const formatSalary = (job: Job) => {
    if (job.budget?.min && job.budget.max) {
      return `$${(job.budget.min / 1000).toFixed(0)}k – $${(job.budget.max / 1000).toFixed(0)}k/yr`;
    }
    if (job.budget?.min) return `From $${(job.budget.min / 1000).toFixed(0)}k/yr`;
    return null;
  };

  const formatEmploymentType = (type?: string) => {
    if (!type) return null;
    return type.replace('_', '-').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Browse Jobs</h1>
        </div>

        {/* Search & Filter */}
        <div className="px-4 pb-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search jobs by title or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 min-h-[44px]"
            />
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            <Button
              key="all"
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full whitespace-nowrap"
              onClick={() => setSelectedCategory('')}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                className="rounded-full whitespace-nowrap"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-600">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => setSelectedCategory('')}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 px-1">{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found</p>
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      {job.companyName && (
                        <p className="text-sm text-gray-600">{job.companyName}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.employmentType && (
                        <Badge variant="secondary" className="text-xs">
                          {formatEmploymentType(job.employmentType)}
                        </Badge>
                      )}
                      {job.workLocation && (
                        <Badge variant="secondary" className="text-xs">
                          {formatEmploymentType(job.workLocation)}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                      {(job.city || job.state) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {[job.city, job.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {formatSalary(job) && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="size-3" />
                          {formatSalary(job)}
                        </span>
                      )}
                    </div>

                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.skills.slice(0, 4).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{job.skills.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {jobs.length === 0 && !loading && (
              <div className="text-center py-12">
                <Briefcase className="size-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No jobs found</h3>
                <p className="text-sm text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
