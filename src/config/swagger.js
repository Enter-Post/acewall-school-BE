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
            course: {
              type: 'string',
              description: 'Course ID reference'
            },
            totalMarks: {
              type: 'number',
              description: 'Total marks for discussion'
            },
            topic: {
              type: 'string',
              description: 'Discussion topic'
            },
            description: {
              type: 'string',
              description: 'Discussion description'
            },
            files: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  filename: { type: 'string' },
                  publicId: { type: 'string' }
                }
              }
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Discussion due date'
            },
            category: {
              type: 'string',
              description: 'Category ID reference'
            },
            semester: {
              type: 'string',
              description: 'Semester ID reference'
            },
            quarter: {
              type: 'string',
              description: 'Quarter ID reference'
            },
            chapter: {
              type: 'string',
              description: 'Chapter ID reference'
            },
            lesson: {
              type: 'string',
              description: 'Lesson ID reference'
            },
            type: {
              type: 'string',
              description: 'Discussion type'
            },
            createdby: {
              type: 'string',
              description: 'Creator ID reference'
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
        },
        Subcategory: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Subcategory unique identifier'
            },
            title: {
              type: 'string',
              description: 'Subcategory title'
            },
            category: {
              type: 'string',
              description: 'Parent category ID reference'
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
        Semester: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Semester unique identifier'
            },
            title: {
              type: 'string',
              description: 'Semester title'
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'Semester start date'
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'Semester end date'
            },
            isArchived: {
              type: 'boolean',
              description: 'Archive status'
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
        Quarter: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Quarter unique identifier'
            },
            title: {
              type: 'string',
              description: 'Quarter title'
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'Quarter start date'
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'Quarter end date'
            },
            isArchived: {
              type: 'boolean',
              description: 'Archive status'
            },
            semester: {
              type: 'string',
              description: 'Parent semester ID reference'
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
        Submission: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Submission unique identifier'
            },
            assessment: {
              type: 'string',
              description: 'Assessment ID reference'
            },
            studentId: {
              type: 'string',
              description: 'Student ID reference'
            },
            answers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionId: { type: 'string' },
                  selectedAnswer: { type: 'string' },
                  file: {
                    type: 'object',
                    properties: {
                      url: { type: 'string' },
                      filename: { type: 'string' },
                      publicId: { type: 'string' }
                    }
                  },
                  isCorrect: { type: 'boolean' },
                  pointsAwarded: { type: 'number' },
                  requiresManualCheck: { type: 'boolean' }
                }
              }
            },
            status: {
              type: 'string',
              enum: ['pending', 'submitted', 'graded'],
              description: 'Submission status'
            },
            totalScore: {
              type: 'number',
              description: 'Total score achieved'
            },
            submittedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Submission timestamp'
            },
            graded: {
              type: 'boolean',
              description: 'Grading status'
            },
            feedback: {
              type: 'string',
              description: 'Instructor feedback'
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
        Message: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Message unique identifier'
            },
            conversationId: {
              type: 'string',
              description: 'Conversation ID reference'
            },
            sender: {
              type: 'string',
              description: 'Sender ID reference'
            },
            text: {
              type: 'string',
              description: 'Message text content'
            },
            image: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                filename: { type: 'string' },
                publicId: { type: 'string' }
              }
            },
            file: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                filename: { type: 'string' },
                publicId: { type: 'string' }
              }
            },
            readBy: {
              type: 'array',
              items: { type: 'string' },
              description: 'User IDs who read the message'
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
        Conversation: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Conversation unique identifier'
            },
            members: {
              type: 'array',
              items: { type: 'string' },
              description: 'Participant user IDs'
            },
            lastMessage: {
              type: 'string',
              description: 'Last message content'
            },
            lastMessageAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last message timestamp'
            },
            lastSeen: {
              type: 'object',
              description: 'Last seen timestamps per user'
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
        Notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Notification unique identifier'
            },
            recipient: {
              type: 'string',
              description: 'Recipient user ID'
            },
            sender: {
              type: 'string',
              description: 'Sender user ID'
            },
            message: {
              type: 'string',
              description: 'Notification message'
            },
            type: {
              type: 'string',
              description: 'Notification type'
            },
            link: {
              type: 'string',
              description: 'Action link'
            },
            isRead: {
              type: 'boolean',
              description: 'Read status'
            },
            isEnded: {
              type: 'boolean',
              description: 'Ended status'
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
        ZoomMeeting: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Zoom meeting unique identifier'
            },
            course: {
              type: 'string',
              description: 'Course ID reference'
            },
            topic: {
              type: 'string',
              description: 'Meeting topic'
            },
            meetingId: {
              type: 'string',
              description: 'Zoom meeting ID'
            },
            startUrl: {
              type: 'string',
              description: 'Host start URL'
            },
            joinUrl: {
              type: 'string',
              description: 'Participant join URL'
            },
            password: {
              type: 'string',
              description: 'Meeting password'
            },
            duration: {
              type: 'number',
              description: 'Meeting duration in minutes'
            },
            createdBy: {
              type: 'string',
              description: 'Creator user ID'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'started', 'ended', 'cancelled'],
              description: 'Meeting status'
            },
            scheduledAt: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled start time'
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
        Announcement: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Announcement unique identifier'
            },
            title: {
              type: 'string',
              description: 'Announcement title'
            },
            message: {
              type: 'string',
              description: 'Announcement message'
            },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  filename: { type: 'string' },
                  publicId: { type: 'string' }
                }
              }
            },
            links: {
              type: 'array',
              items: { type: 'string' },
              description: 'Related links'
            },
            teacher: {
              type: 'string',
              description: 'Teacher ID reference'
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
        Comment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Comment unique identifier'
            },
            text: {
              type: 'string',
              description: 'Comment text'
            },
            course: {
              type: 'string',
              description: 'Course ID reference'
            },
            createdby: {
              type: 'string',
              description: 'Creator user ID'
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
        DiscussionComment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Discussion comment unique identifier'
            },
            text: {
              type: 'string',
              description: 'Comment text'
            },
            discussion: {
              type: 'string',
              description: 'Discussion ID reference'
            },
            role: {
              type: 'string',
              description: 'User role'
            },
            createdby: {
              type: 'string',
              description: 'Creator user ID'
            },
            gradedBy: {
              type: 'string',
              description: 'Grader user ID'
            },
            marksObtained: {
              type: 'number',
              description: 'Marks obtained for comment'
            },
            isGraded: {
              type: 'boolean',
              description: 'Grading status'
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
        ReplyDiscussion: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Reply unique identifier'
            },
            text: {
              type: 'string',
              description: 'Reply text'
            },
            role: {
              type: 'string',
              description: 'User role'
            },
            comment: {
              type: 'string',
              description: 'Parent comment ID reference'
            },
            createdby: {
              type: 'string',
              description: 'Creator user ID'
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
