import { useNavigate } from 'react-router';
import { ArrowLeft, MessageCircle, Mail, Phone, FileText, HelpCircle, Book } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';

const faqCategories = [
  {
    title: 'Getting Started',
    icon: Book,
    questions: [
      'How do I create a request?',
      'How do I switch between Client and Provider mode?',
      'How do I set up my profile?',
    ],
  },
  {
    title: 'Payments',
    icon: FileText,
    questions: [
      'How do I get paid?',
      'What payment methods are accepted?',
      'When will I receive my earnings?',
    ],
  },
  {
    title: 'Account',
    icon: HelpCircle,
    questions: [
      'How do I verify my account?',
      'How do I change my password?',
      'Can I delete my account?',
    ],
  },
];

export default function HelpSupport() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/profile')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-semibold">Help & Support</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
        {/* Contact Options */}
        <div className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border hover:border-blue-500 transition-colors">
            <div className="p-3 bg-blue-50 rounded-full">
              <MessageCircle className="size-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium">Live Chat</span>
          </button>

          <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border hover:border-blue-500 transition-colors">
            <div className="p-3 bg-green-50 rounded-full">
              <Mail className="size-5 text-green-600" />
            </div>
            <span className="text-xs font-medium">Email</span>
          </button>

          <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border hover:border-blue-500 transition-colors">
            <div className="p-3 bg-purple-50 rounded-full">
              <Phone className="size-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium">Call</span>
          </button>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-3">
          <h3 className="font-semibold px-1">Frequently Asked Questions</h3>
          
          {faqCategories.map((category) => (
            <Card key={category.title}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <category.icon className="size-5 text-gray-600" />
                  </div>
                  <h4 className="font-semibold">{category.title}</h4>
                </div>
                <div className="space-y-2 ml-11">
                  {category.questions.map((question, index) => (
                    <button
                      key={index}
                      className="w-full text-left text-sm text-blue-600 hover:underline"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit a Request */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">Submit a Support Request</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full h-10 px-3 rounded-md border bg-white text-sm"
                >
                  <option>Select a category</option>
                  <option>Account Issues</option>
                  <option>Payment Problems</option>
                  <option>Technical Support</option>
                  <option>Report a Bug</option>
                  <option>Feature Request</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  className="bg-white resize-none"
                />
              </div>

              <Button className="w-full">
                Submit Request
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Additional Resources</h3>
            
            <Button variant="outline" className="w-full justify-start">
              <Book className="size-4 mr-2" />
              User Guide
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <FileText className="size-4 mr-2" />
              Terms of Service
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <FileText className="size-4 mr-2" />
              Privacy Policy
            </Button>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-5 space-y-2">
            <h3 className="font-semibold">24/7 Support Available</h3>
            <p className="text-sm text-gray-700">
              Our support team is available around the clock to help you with any questions or issues.
            </p>
            <div className="text-sm space-y-1 pt-2">
              <p className="flex items-center gap-2">
                <Mail className="size-4" />
                <a href="mailto:support@ineedsomeone.com" className="text-blue-600 hover:underline">
                  support@ineedsomeone.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4" />
                <a href="tel:+15551234567" className="text-blue-600 hover:underline">
                  +1 (555) 123-4567
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
