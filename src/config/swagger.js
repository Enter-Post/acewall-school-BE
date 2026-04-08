import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AceWall Scholars Backend API',
      version: '1.0.0',
      description: 'Comprehensive Learning Management System API for educational institutions',
      contact: {
        name: 'API Support',
        email: 'support@acewallscholars.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5051',
        description: 'Development server'
      },
      {
        url: 'https://acewallscholarslearningonline.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authentication token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User unique identifier'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            role: {
              type: 'string',
              enum: ['student', 'teacher', 'admin', 'teacherAsStudent', 'parent', 'instructor'],
              description: 'User role in the system'
            },
            profileImg: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                filename: { type: 'string' },
                publicId: { type: 'string' }
              }
            },
            phone: {
              type: 'string',
              description: 'User phone number'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp'
            }
          }
        },
        Course: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Course unique identifier'
            },
            title: {
              type: 'string',
              description: 'Course title'
            },
            description: {
              type: 'string',
              description: 'Course description'
            },
            courseCode: {
              type: 'string',
              description: 'Unique course code'
            },
            teacher: {
              type: 'string',
              description: 'Teacher ID reference'
            },
            category: {
              type: 'string',
              description: 'Category ID reference'
            },
            subcategory: {
              type: 'string',
              description: 'Subcategory ID reference'
            },
            price: {
              type: 'number',
              description: 'Course price'
            },
            thumbnail: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                filename: { type: 'string' },
                publicId: { type: 'string' }
              }
            },
            isArchived: {
              type: 'boolean',
              description: 'Course archive status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Category unique identifier'
            },
            name: {
              type: 'string',
              description: 'Category name'
            },
            description: {
              type: 'string',
              description: 'Category description'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Assessment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Assessment unique identifier'
            },
            title: {
              type: 'string',
              description: 'Assessment title'
            },
            description: {
              type: 'string',
              description: 'Assessment description'
            },
            course: {
              type: 'string',
              description: 'Course ID reference'
            },
            type: {
              type: 'string',
              enum: ['quiz', 'assignment', 'exam', 'project'],
              description: 'Assessment type'
            },
            totalPoints: {
              type: 'number',
              description: 'Total points for assessment'
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Assessment due date'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Chapter: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Chapter unique identifier'
            },
            title: {
              type: 'string',
              description: 'Chapter title'
            },
            description: {
              type: 'string',
              description: 'Chapter description'
            },
            course: {
              type: 'string',
              description: 'Course ID reference'
            },
            order: {
              type: 'number',
              description: 'Chapter order in course'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Lesson: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Lesson unique identifier'
            },
            title: {
              type: 'string',
              description: 'Lesson title'
            },
            content: {
              type: 'string',
              description: 'Lesson content'
            },
            chapter: {
              type: 'string',
              description: 'Chapter ID reference'
            },
            course: {
              type: 'string',
              description: 'Course ID reference'
            },
            order: {
              type: 'number',
              description: 'Lesson order in chapter'
            },
            videoUrl: {
              type: 'string',
              description: 'Lesson video URL'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Enrollment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Enrollment unique identifier'
            },
            student: {
              type: 'string',
              description: 'Student ID reference'
            },
            course: {
              type: 'string',
              description: 'Course ID reference'
            },
            enrolledAt: {
              type: 'string',
              format: 'date-time',
              description: 'Enrollment timestamp'
            },
            progress: {
              type: 'number',
              description: 'Course completion percentage'
            },
            status: {
              type: 'string',
              enum: ['active', 'completed', 'dropped'],
              description: 'Enrollment status'
            }
          }
        },
        Discussion: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Discussion unique identifier'
            },
            title: {
              type: 'string',
              description: 'Discussion title'
            },
            content: {
              type: 'string',
              description: 'Discussion content'
            },
            author: {
              type: 'string',
              description: 'Author ID reference'
            },
            course: {
              type: 'string',
              description: 'Course ID reference'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Request success status'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            data: {
              type: 'object',
              description: 'Response data payload'
            },
            error: {
              type: 'string',
              description: 'Error message if applicable'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error description'
            },
            error: {
              type: 'string',
              description: 'Detailed error information'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization operations'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Courses',
        description: 'Course management operations'
      },
      {
        name: 'Categories',
        description: 'Category and subcategory management'
      },
      {
        name: 'Chapters',
        description: 'Chapter management within courses'
      },
      {
        name: 'Lessons',
        description: 'Lesson management within chapters'
      },
      {
        name: 'Assessments',
        description: 'Assessment and quiz management'
      },
      {
        name: 'Enrollments',
        description: 'Student enrollment management'
      },
      {
        name: 'Discussions',
        description: 'Discussion forum management'
      },
      {
        name: 'Messages',
        description: 'Private messaging system'
      },
      {
        name: 'Notifications',
        description: 'Notification management'
      },
      {
        name: 'Attendance',
        description: 'Student attendance tracking'
      },
      {
        name: 'Gradebook',
        description: 'Grade and GPA management'
      },
      {
        name: 'Zoom',
        description: 'Zoom meeting integration'
      },
      {
        name: 'Support',
        description: 'Customer support system'
      }
    ]
  },
  apis: [
    './src/Routes/*.js',
    './src/Routes/**/*.js',
    './src/Models/*.js'
  ]
};

export const specs = swaggerJsdoc(options);
