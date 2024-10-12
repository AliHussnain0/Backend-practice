class ApiResponce {

    constructor(
        statusCode,
            data,
        message,
        stack
    )
    {

        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400;
        this.stack = stack;
    }


}
export { ApiResponce };