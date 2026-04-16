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
        },
        Post: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Post unique identifier'
            },
            text: {
              type: 'string',
              description: 'Post content'
            },
            assets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  fileName: { type: 'string' },
                  type: { type: 'string' }
                }
              }
            },
            author: {
              type: 'string',
              description: 'Author user ID reference'
            },
            color: {
              type: 'string',
              description: 'Post color theme'
            },
            postType: {
              type: 'string',
              enum: ['public', 'course'],
              description: 'Post visibility type'
            },
            course: {
              type: 'string',
              description: 'Course ID reference (required if postType is course)'
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
        PostComment: {
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
            author: {
              type: 'string',
              description: 'Author user ID reference'
            },
            post: {
              type: 'string',
              description: 'Post ID reference'
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
        GuardianAcc: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Guardian account unique identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Guardian email address'
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
        OTP: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'OTP unique identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            otp: {
              type: 'string',
              description: 'One-time password'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'OTP expiration time'
            },
            isVerified: {
              type: 'boolean',
              description: 'Verification status'
            },
            userData: {
              type: 'object',
              description: 'User data for registration'
            },
            phoneOtp: {
              type: 'string',
              description: 'Phone OTP'
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
        AIChat: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'AI Chat unique identifier'
            },
            userId: {
              type: 'string',
              description: 'User ID'
            },
            question: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                sender: { type: 'string' }
              }
            },
            answer: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                sender: { type: 'string' }
              }
            },
            generatedFile: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                filename: { type: 'string' },
                sender: { type: 'string' },
                FileType: { type: 'string' }
              }
            },
            file: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                filename: { type: 'string' },
                sender: { type: 'string' }
              }
            },
            difficulty: {
              type: 'string',
              description: 'Difficulty level'
            },
            fileUsed: {
              type: 'string',
              description: 'File used for context'
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
        Book: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Book unique identifier'
            },
            title: {
              type: 'string',
              description: 'Book title'
            },
            subject: {
              type: 'string',
              description: 'Book subject'
            },
            rawText: {
              type: 'string',
              description: 'Extracted text content'
            },
            originalfile: {
              type: 'string',
              description: 'Original file path'
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
        PacingChart: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Pacing chart unique identifier'
            },
            course: {
              type: 'string',
              description: 'Course ID reference'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  startDate: { type: 'string', format: 'date-time' },
                  endDate: { type: 'string', format: 'date-time' },
                  week: { type: 'string' },
                  topic: { type: 'string' },
                  description: { type: 'string' },
                  objectives: { type: 'array', items: { type: 'string' } },
                  resources: { type: 'array', items: { type: 'string' } }
                }
              }
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
        AssessmentCategory: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Assessment category unique identifier'
            },
            name: {
              type: 'string',
              description: 'Category name'
            },
            weight: {
              type: 'number',
              description: 'Category weight percentage'
            },
            course: {
              type: 'string',
              description: 'Course ID reference'
            },
            createdBy: {
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
        Gradebook: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Gradebook unique identifier'
            },
            studentId: {
              type: 'string',
              description: 'Student ID reference'
            },
            courseId: {
              type: 'string',
              description: 'Course ID reference'
            },
            courseTitle: {
              type: 'string',
              description: 'Course title'
            },
            semesters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  semesterId: { type: 'string' },
                  semesterTitle: { type: 'string' },
                  gradePercentage: { type: 'number' },
                  letterGrade: { type: 'string' },
                  quarters: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        quarterId: { type: 'string' },
                        quarterTitle: { type: 'string' },
                        gradePercentage: { type: 'number' },
                        gpa: { type: 'number' },
                        letterGrade: { type: 'string' },
                        standardGrade: {
                          type: 'object',
                          properties: {
                            points: { type: 'number' },
                            remarks: { type: 'string' }
                          }
                        },
                        categoryBreakdown: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              categoryId: { type: 'string' },
                              categoryName: { type: 'string' },
                              percentage: { type: 'number' },
                              weight: { type: 'number' }
                            }
                          }
                        },
                        items: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              itemId: { type: 'string' },
                              itemType: { type: 'string' },
                              title: { type: 'string' },
                              categoryId: { type: 'string' },
                              categoryName: { type: 'string' },
                              maxPoints: { type: 'number' },
                              studentPoints: { type: 'number' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            finalPercentage: {
              type: 'number',
              description: 'Final course percentage'
            },
            finalGPA: {
              type: 'number',
              description: 'Final GPA'
            },
            finalLetterGrade: {
              type: 'string',
              description: 'Final letter grade'
            },
            standardGrade: {
              type: 'object',
              properties: {
                points: { type: 'number' },
                remarks: { type: 'string' }
              }
            },
            totalAssessments: {
              type: 'number',
              description: 'Total number of assessments'
            },
            lastUpdated: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        GPA: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'GPA scale unique identifier'
            },
            gpaScale: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  gpa: { type: 'number' },
                  minPercentage: { type: 'number' },
                  maxPercentage: { type: 'number' }
                }
              }
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
        StandardGrading: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Standard grading scale unique identifier'
            },
            scale: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  points: { type: 'string' },
                  remarks: { type: 'string' },
                  minPercentage: { type: 'number' },
                  maxPercentage: { type: 'number' }
                }
              }
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
        GradingScale: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Grading scale unique identifier'
            },
            scale: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  grade: { type: 'string' },
                  min: { type: 'number' },
                  max: { type: 'number' },
                  letter: { type: 'string' }
                }
              }
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
        Rating: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Rating unique identifier'
            },
            star: {
              type: 'number',
              description: 'Star rating (1-5)'
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
            }
          }
        },
        CourseShare: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Course share unique identifier'
            },
            course: {
              type: 'string',
              description: 'Course ID reference'
            },
            sharedBy: {
              type: 'string',
              description: 'User ID who shared the course'
            },
            sharedWith: {
              type: 'string',
              description: 'User ID who received the share'
            },
            status: {
              type: 'string',
              enum: ['pending', 'imported', 'rejected'],
              description: 'Share status'
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
        Purchase: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Purchase unique identifier'
            },
            student: {
              type: 'string',
              description: 'Student user ID reference'
            },
            course: {
              type: 'string',
              description: 'Course ID reference'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed'],
              description: 'Purchase status'
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
        LoginActivity: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Login activity unique identifier'
            },
            userId: {
              type: 'string',
              description: 'User ID reference'
            },
            loginAt: {
              type: 'string',
              format: 'date-time',
              description: 'Login timestamp'
            },
            ipAddress: {
              type: 'string',
              description: 'IP address'
            },
            userAgent: {
              type: 'string',
              description: 'User agent string'
            },
            createdAt: {
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
      },
      {
        name: 'Posts',
        description: 'Social posts and content sharing'
      },
      {
        name: 'Semester',
        description: 'Academic semester management'
      },
      {
        name: 'Quarter',
        description: 'Academic quarter management'
      },
      {
        name: 'Submissions',
        description: 'Assessment submission management'
      },
      {
        name: 'GPA',
        description: 'GPA scale and grading management'
      },
      {
        name: 'Conversation',
        description: 'Conversation and messaging management'
      },
      {
        name: 'Comments',
        description: 'Course comments management'
      },
      {
        name: 'AI Chat',
        description: 'AI-powered chat and content generation'
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
