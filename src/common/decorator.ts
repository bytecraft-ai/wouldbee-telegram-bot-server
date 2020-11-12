import { NotImplementedException } from '@nestjs/common';
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';


// TODO
export function IsIntEnum(property: number, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isIntEnum',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];
                    throw new NotImplementedException();
                    // return typeof value === 'string' && typeof relatedValue === 'string' && value.length > relatedValue.length; // you can return a Promise<boolean> here as well, if you want to make async validation
                },
            },
        });
    };
}


export function IsLongerThan(property: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isLongerThan',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];
                    return typeof value === 'string' && typeof relatedValue === 'string' && value.length > relatedValue.length; // you can return a Promise<boolean> here as well, if you want to make async validation
                },
            },
        });
    };
}