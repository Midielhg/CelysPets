import React from 'react';
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

const MobileOverview: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Cely's Pets Admin
          </h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2 from yesterday
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">142</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5 this week
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$640</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  15% above avg
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">75m</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  On schedule
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule Section */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
            <span className="text-sm text-gray-500">8 appointments</span>
          </div>
          
          <div className="space-y-3">
            {[
              { time: '9:00 AM', client: 'Sarah Johnson', pet: 'Max (Golden Retriever)', service: 'Full Grooming', address: '123 Main St, Miami', status: 'confirmed' },
              { time: '10:30 AM', client: 'Mike Rodriguez', pet: 'Luna (Poodle)', service: 'Bath & Brush', address: '456 Oak Ave, Miami', status: 'confirmed' },
              { time: '12:00 PM', client: 'Emily Davis', pet: 'Buddy (Lab Mix)', service: 'Nail Trim', address: '789 Pine Rd, Miami', status: 'pending' }
            ].map((appointment, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-16 text-center">
                  <div className="text-sm font-medium text-gray-900">{appointment.time}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">{appointment.client}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{appointment.pet} • {appointment.service}</p>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {appointment.address}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 bg-blue-50 text-blue-600 py-3 rounded-lg font-medium hover:bg-blue-100 transition-colors">
            View Full Schedule
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Calendar className="w-6 h-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">Add Appointment</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <Users className="w-6 h-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">New Client</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <MapPin className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">Route Optimize</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
              <DollarSign className="w-6 h-6 text-amber-600 mb-2" />
              <span className="text-sm font-medium text-amber-900">Pricing</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          
          <div className="space-y-3">
            {[
              { action: 'New appointment booked', client: 'Jennifer Adams', time: '2 minutes ago', type: 'appointment' },
              { action: 'Payment received', client: 'Tom Wilson', time: '15 minutes ago', type: 'payment' },
              { action: 'Appointment completed', client: 'Lisa Chen', time: '1 hour ago', type: 'completed' },
              { action: 'New client registered', client: 'David Brown', time: '2 hours ago', type: 'client' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'appointment' ? 'bg-blue-100' :
                  activity.type === 'payment' ? 'bg-green-100' :
                  activity.type === 'completed' ? 'bg-purple-100' :
                  'bg-amber-100'
                }`}>
                  {activity.type === 'appointment' && <Calendar className="w-4 h-4 text-blue-600" />}
                  {activity.type === 'payment' && <DollarSign className="w-4 h-4 text-green-600" />}
                  {activity.type === 'completed' && <Clock className="w-4 h-4 text-purple-600" />}
                  {activity.type === 'client' && <Users className="w-4 h-4 text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.client}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white mt-6">
          <h3 className="text-lg font-semibold mb-3">Business Contact</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-3" />
              <span className="text-sm">(786) 222-3785</span>
            </div>
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-3" />
              <span className="text-sm">info@celyspets.com</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-3" />
              <span className="text-sm">Miami, Florida</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileOverview;
