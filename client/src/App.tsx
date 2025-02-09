import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UserPlus, Edit2, Trash2, X, Save, Plus, School2, ChevronLeft, ChevronRight } from 'lucide-react'
import Swal from 'sweetalert2'

declare global {
    interface Window {
        searchTimeout: number | undefined;
    }
}

interface Student {
    _id?: string
    student_id: string
    firstname: string
    lastname: string
    nickname: string
}

interface PaginationData {
    total: number
    page: number
    limit: number
    totalPages: number
}

function App() {
    const [students, setStudents] = useState<Student[]>([])
    const [searchText, setSearchText] = useState('')
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 0
    })
    const [formData, setFormData] = useState<Student>({
        student_id: '',
        firstname: '',
        lastname: '',
        nickname: ''
    })
    const [isSearchMode, setIsSearchMode] = useState(false)

    useEffect(() => {
        if (!searchText.trim()) {
            setIsSearchMode(false)
        }
        fetchStudents()
    }, [pagination.page])

    const fetchStudents = async () => {
        try {
            let response;
            if (isSearchMode && searchText.trim()) {
                const encodedSearchText = encodeURIComponent(searchText.trim());
                response = await axios.get(
                    `http://localhost:3000/students/search/${encodedSearchText}?page=${pagination.page}&limit=${pagination.limit}`
                );
            } else {
                response = await axios.get(
                    `http://localhost:3000/students?page=${pagination.page}&limit=${pagination.limit}`
                );
            }
            setStudents(response.data.students);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const handleSearch = async () => {
        try {
            if (!searchText.trim()) {
                setIsSearchMode(false)
                setPagination(prev => ({ ...prev, page: 1 }));
                await fetchStudents();
                return;
            }
    
            setIsSearchMode(true)
            const encodedSearchText = encodeURIComponent(searchText.trim());
            const response = await axios.get(
                `http://localhost:3000/students/search/${encodedSearchText}?page=1&limit=${pagination.limit}`
            );
    
            setStudents(response.data.students);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error searching students:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to search students. Please try again.',
                icon: 'error',
                background: '#1f2937',
                color: '#fff'
            });
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
        if (!e.target.value.trim()) {
            setIsSearchMode(false)
            setPagination(prev => ({ ...prev, page: 1 }));
            fetchStudents();
        }
    }

    const handlePageChange = async (newPage: number) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (selectedStudent?._id) {
                // Remove _id from formData before sending update
                const { _id, ...updateData } = formData;
                await axios.put(`http://localhost:3000/students/${selectedStudent._id}`, updateData)
            } else {
                await axios.post('http://localhost:3000/students', formData)
            }
            await fetchStudents()
            setIsModalOpen(false)
            setSelectedStudent(null)
            setFormData({
                student_id: '',
                firstname: '',
                lastname: '',
                nickname: ''
            })
            // Success message
            Swal.fire({
                title: 'Success!',
                text: selectedStudent ? 'Student updated successfully!' : 'Student added successfully!',
                icon: 'success',
                background: '#1f2937',
                color: '#fff'
            })
        } catch (error: any) {
            console.error('Error saving student:', error?.response?.data || error)
            const errorMessage = error?.response?.data?.message || 'An error occurred while saving the student.'
            
            Swal.fire({
                title: 'Error!',
                text: errorMessage,
                icon: 'error',
                background: '#1f2937',
                color: '#fff'
            })
        }
    }

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
            background: '#1f2937', // Dark theme
            color: '#fff'
        })

        if (result.isConfirmed) {
            try {
                await axios.delete(`http://localhost:3000/students/${id}`)
                await fetchStudents()
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Student has been deleted.',
                    icon: 'success',
                    background: '#1f2937',
                    color: '#fff'
                })
            } catch (error) {
                console.error('Error deleting student:', error)
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to delete student.',
                    icon: 'error',
                    background: '#1f2937',
                    color: '#fff'
                })
            }
        }
    }

    const openEditModal = (student: Student) => {
        setSelectedStudent(student)
        setFormData(student)
        setIsModalOpen(true)
    }

    const renderPaginationNumbers = () => {
        const pages = [];
        const maxVisible = 5; // Show max 5 page numbers
    
        let start = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
        let end = Math.min(start + maxVisible - 1, pagination.totalPages);
    
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
    
        for (let i = start; i <= end; i++) {
            pages.push(
                <motion.button
                    key={i}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 rounded-md ${
                        pagination.page === i
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    {i}
                </motion.button>
            );
        }
    
        return pages;
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-900 text-gray-100 p-8"
        >
            {/* Header */}
            <div className="max-w-7xl mx-auto">
                <motion.h1 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", duration: 1 }}
                    className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent flex items-center justify-center gap-3"
                >
                    <School2 className="w-10 h-10" />
                    Hakim Students
                </motion.h1>

                {/* Search and Add Section */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-4 mb-8"
                >
                    <div className="flex-1 flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search by ID, name, or nickname..."
                                value={searchText}
                                onChange={handleSearchChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-11 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            {searchText && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        setSearchText('');
                                        setIsSearchMode(false);
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                        fetchStudents();
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            )}
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSearch}
                            className="cursor-pointer px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Search className="w-4 h-4" />
                            Search
                        </motion.button>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setSelectedStudent(null)
                            setFormData({
                                student_id: '',
                                firstname: '',
                                lastname: '',
                                nickname: ''
                            })
                            setIsModalOpen(true)
                        }}
                        className="cursor-pointer px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Student
                    </motion.button>
                </motion.div>

                {/* Students Table */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gray-800 rounded-lg overflow-hidden"
                >
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left">Student ID</th>
                                <th className="px-6 py-3 text-left">First Name</th>
                                <th className="px-6 py-3 text-left">Last Name</th>
                                <th className="px-6 py-3 text-left">Nickname</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <AnimatePresence mode="wait">
                            <motion.tbody 
                                key={pagination.page}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="divide-y divide-gray-700"
                            >
                                {students.map((student) => (
                                    <tr
                                        key={student._id}
                                        className="hover:bg-gray-750"
                                    >
                                        <td className="px-6 py-4">{student.student_id}</td>
                                        <td className="px-6 py-4">{student.firstname}</td>
                                        <td className="px-6 py-4">{student.lastname}</td>
                                        <td className="px-6 py-4">{student.nickname}</td>
                                        <td className="px-6 py-4 text-right">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => openEditModal(student)}
                                                className="cursor-pointer text-blue-400 hover:text-blue-300 mr-4 inline-flex items-center gap-1"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Edit
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => student._id && handleDelete(student._id)}
                                                className="cursor-pointer text-red-400 hover:text-red-300 inline-flex items-center gap-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </motion.button>
                                        </td>
                                    </tr>
                                ))}
                            </motion.tbody>
                        </AnimatePresence>
                    </table>
                </motion.div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 flex justify-center items-center gap-2"
                    >
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="p-2 rounded-lg bg-gray-800 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 flex items-center gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </motion.button>
                        
                        <div className="flex items-center gap-2">
                            {renderPaginationNumbers()}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            className="p-2 rounded-lg bg-gray-800 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 flex items-center gap-1"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    </motion.div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsModalOpen(false)}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            onClick={(e) => e.stopPropagation()} // Prevent click from reaching the backdrop
                            className="bg-gray-800/90 backdrop-blur-md rounded-lg p-8 max-w-md w-full shadow-xl border border-gray-700/50"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">
                                    {selectedStudent ? 'Edit Student' : 'Add New Student'}
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-300"
                                >
                                    <X className="w-6 h-6" />
                                </motion.button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Student ID</label>
                                    <input
                                        type="text"
                                        value={formData.student_id}
                                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.firstname}
                                        onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.lastname}
                                        onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nickname</label>
                                    <input
                                        type="text"
                                        value={formData.nickname}
                                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex gap-4 mt-6">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                                    >
                                        {selectedStudent ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                        {selectedStudent ? 'Update' : 'Add'}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default App
