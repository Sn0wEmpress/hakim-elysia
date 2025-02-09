import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UserPlus, Edit2, Trash2, X, Save, Plus, School2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'
import { useDebounce } from './hooks/useDebounce'

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

const tableVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: {
            duration: 0.2,
            staggerChildren: 0.05
        }
    }
}

const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
        opacity: 1, 
        x: 0,
        transition: {
            duration: 0.2
        }
    },
}

function App() {
    const [students, setStudents] = useState<Student[]>([])
    const [searchText, setSearchText] = useState('')
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
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
    
    const debouncedSearchText = useDebounce(searchText, 500) // 500ms delay
    const fetchStudents = useCallback(async () => {
        setIsLoading(true)
        try {
            let response;
            if (debouncedSearchText.trim()) {
                const encodedSearchText = encodeURIComponent(debouncedSearchText.trim());
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
            Swal.fire({
                title: 'Error!',
                text: 'Failed to fetch students. Please try again.',
                icon: 'error',
                background: '#1f2937',
                color: '#fff'
            });
        } finally {
            setIsLoading(false)
        }
    }, [debouncedSearchText, pagination.page, pagination.limit]);

    useEffect(() => {
        if (debouncedSearchText !== searchText) {
            setPagination(prev => ({ ...prev, page: 1 }));
        }
    }, [debouncedSearchText, searchText]);

    useEffect(() => {
        if (!isLoading) {
            fetchStudents();
        }
    }, [fetchStudents, debouncedSearchText, pagination.page]);

    const handleSearch = useCallback(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchText(newValue);
    }, []);

    const handleClearSearch = useCallback(() => {
        setSearchText('');
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
        if (newPage < 1 || newPage > pagination.totalPages || isLoading) return;
        setPagination(prev => ({ ...prev, page: newPage }));
    }, [pagination.totalPages, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            if (selectedStudent?._id) {
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
            Swal.fire({
                title: 'Success!',
                text: selectedStudent ? 'Student updated successfully!' : 'Student added successfully!',
                icon: 'success',
                background: '#1f2937',
                color: '#fff',
                showConfirmButton: false,
                timer: 1500
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
        } finally {
            setIsLoading(false)
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
            background: '#1f2937',
            color: '#fff'
        })

        if (result.isConfirmed) {
            setIsLoading(true)
            try {
                await axios.delete(`http://localhost:3000/students/${id}`)
                await fetchStudents()
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Student has been deleted.',
                    icon: 'success',
                    background: '#1f2937',
                    color: '#fff',
                    showConfirmButton: false,
                    timer: 1500
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
            } finally {
                setIsLoading(false)
            }
        }
    }

    const openEditModal = useCallback((student: Student) => {
        setSelectedStudent(student)
        setFormData(student)
        setIsModalOpen(true)
    }, []);

    const renderPaginationNumbers = useMemo(() => {
        const pages = [];
        const maxVisible = 5;
    
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
                    className={`px-3 py-1 rounded-md transition-colors duration-200 ${
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
    }, [pagination.page, pagination.totalPages, handlePageChange]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-8"
        >
            <div className="max-w-7xl mx-auto">
                <motion.h1 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", duration: 1 }}
                    className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center justify-center gap-3"
                >
                    <School2 className="w-10 h-10" />
                    Hakim Students
                </motion.h1>

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
                                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg pl-11 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            />
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            {searchText && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleClearSearch}
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
                            disabled={isLoading}
                            className="cursor-pointer px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4" />
                            )}
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
                        disabled={isLoading}
                        className="cursor-pointer px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Student
                    </motion.button>
                </motion.div>

                <motion.div 
                    variants={tableVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700/50 shadow-xl"
                >
                    <table className="w-full">
                        <thead className="bg-gray-700/50">
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
                                variants={tableVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                className="divide-y divide-gray-700/50"
                            >
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                                                className="inline-flex items-center gap-2"
                                            >
                                                <Loader2 className="w-6 h-6" />
                                                <span>Loading...</span>
                                            </motion.div>
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                            No students found
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student) => (
                                        <motion.tr
                                            key={student._id}
                                            variants={rowVariants}
                                            className="hover:bg-gray-700/30 transition-colors duration-200"
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
                                                    disabled={isLoading}
                                                    className="cursor-pointer text-blue-400 hover:text-blue-300 mr-4 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    Edit
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => student._id && handleDelete(student._id)}
                                                    disabled={isLoading}
                                                    className="cursor-pointer text-red-400 hover:text-red-300 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </motion.button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </motion.tbody>
                        </AnimatePresence>
                    </table>
                </motion.div>

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
                            disabled={pagination.page === 1 || isLoading}
                            className="p-2 rounded-lg bg-gray-800/50 backdrop-blur-sm text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-all duration-200 flex items-center gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </motion.button>
                        
                        <div className="flex items-center gap-2">
                            {renderPaginationNumbers}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages || isLoading}
                            className="p-2 rounded-lg bg-gray-800/50 backdrop-blur-sm text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-all duration-200 flex items-center gap-1"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isLoading && setIsModalOpen(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", duration: 0.3 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gray-800/90 backdrop-blur-md rounded-lg p-8 max-w-md w-full shadow-xl border border-gray-700/50"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                    {selectedStudent ? 'Edit Student' : 'Add New Student'}
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => !isLoading && setIsModalOpen(false)}
                                    disabled={isLoading}
                                    className="text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.firstname}
                                        onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.lastname}
                                        onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nickname</label>
                                    <input
                                        type="text"
                                        value={formData.nickname}
                                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="flex gap-4 mt-6">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : selectedStudent ? (
                                            <Save className="w-4 h-4" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                        {selectedStudent ? 'Update' : 'Add'}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => !isLoading && setIsModalOpen(false)}
                                        disabled={isLoading}
                                        className="flex-1 px-6 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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