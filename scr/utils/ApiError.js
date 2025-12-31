class ApiError extends Error {
    constructor(
        statusCode,
        message = "something went wrong",
        statck = "",
        errors = []
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.errors = errors
        this.message = message
        this.success = false;
        this.statck = statck

        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}  

export { ApiError }
